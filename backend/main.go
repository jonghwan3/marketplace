package main

import (
	"backend/models"
	localGraphQL "backend/graphql"
	"log"
	"backend/middlewares"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/graphql-go/graphql"
	"github.com/graphql-go/handler"
)

func graphqlHandler(schema *graphql.Schema) gin.HandlerFunc {
	h := handler.New(&handler.Config{
		Schema:   schema,
		Pretty:   true,
		GraphiQL: true,
	})

	return func(c *gin.Context) {
		
		c.Request = c.Request.WithContext(c.Request.Context())
		h.ServeHTTP(c.Writer, c.Request)
	}
}

func main() {

	log.Printf("Connecting Databese...")
	models.ConnectDatabase()

	schema, err := graphql.NewSchema(graphql.SchemaConfig{
		Query:    localGraphQL.QueryType(),
		Mutation: localGraphQL.MutationType(),
	})
	if err != nil {
		log.Fatalf("Failed to create GraphQL schema: %v", err)
	}

	router := gin.Default()

    // Add CORS (otherwise cannot connect)
    router.Use(cors.New(cors.Config{
        AllowOrigins:     []string{"http://localhost:3000"}, // Frontend origin
        AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
        AllowHeaders:     []string{"Content-Type", "Authorization"},
        AllowCredentials: true,
    }))
	
	router.POST("/register", func(c *gin.Context) {
		h := handler.New(&handler.Config{
			Schema:   &schema,
			Pretty:   true,
			GraphiQL: true,
		})
		h.ServeHTTP(c.Writer, c.Request)
	})

	
	router.POST("/graphql", middlewares.AuthMiddleware(), graphqlHandler(&schema))
	router.Run(":8080")
}
