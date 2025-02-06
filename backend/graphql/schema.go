package graphql

import (
	"github.com/graphql-go/graphql"
	"backend/controllers"
	"backend/models"
	"errors"
	"time"
	"fmt"
)


var userType = graphql.NewObject(graphql.ObjectConfig{
	Name: "User",
	Fields: graphql.Fields{
		"id":       &graphql.Field{Type: graphql.ID},
		"name": &graphql.Field{Type: graphql.String},
		"email":    &graphql.Field{Type: graphql.String},
	},
})

var itemType = graphql.NewObject(graphql.ObjectConfig{
	Name: "Item",
	Fields: graphql.Fields{
		"id":       &graphql.Field{Type: graphql.ID},
		"class":    &graphql.Field{Type: graphql.String},
		"size":    &graphql.Field{Type: graphql.String},
		"color":    &graphql.Field{Type: graphql.String},
		"price":    &graphql.Field{Type: graphql.String},
		"status":    &graphql.Field{Type: graphql.String},
		"picture":    &graphql.Field{Type: graphql.String},
		"sellerID": &graphql.Field{Type: graphql.ID},
	},
})

var itemDetailType = graphql.NewObject(graphql.ObjectConfig{
	Name: "ItemDetail",
	Fields: graphql.Fields{
		"id":       &graphql.Field{Type: graphql.ID},
		"class": &graphql.Field{Type: graphql.String},
		"size": &graphql.Field{Type: graphql.String},
		"color": &graphql.Field{Type: graphql.String},
		"price": &graphql.Field{Type: graphql.String},
		"status": &graphql.Field{Type: graphql.String},
		"picture": &graphql.Field{Type: graphql.String},
		"createdAt": &graphql.Field{Type: graphql.String},
		"sellerID": &graphql.Field{Type: graphql.ID},
		"isSold": &graphql.Field{Type: graphql.Boolean},
		"soldAt": &graphql.Field{Type: graphql.String},
	},
})

var itemToBeSoldType = graphql.NewObject(graphql.ObjectConfig{
	Name: "itemToBeSold",
	Fields: graphql.Fields{
		"id":       &graphql.Field{Type: graphql.ID},
		"class": &graphql.Field{Type: graphql.String},
		"size": &graphql.Field{Type: graphql.String},
		"color": &graphql.Field{Type: graphql.String},
		"price": &graphql.Field{Type: graphql.String},
		"status": &graphql.Field{Type: graphql.String},
		"picture": &graphql.Field{Type: graphql.String},
		"sellerName": &graphql.Field{Type: graphql.String},
	},
})


var itemHistory = graphql.NewObject(graphql.ObjectConfig{
	Name: "itemHistory",
	Fields: graphql.Fields{
		"id":       &graphql.Field{Type: graphql.ID},
		"name": &graphql.Field{Type: graphql.String},
		"class": &graphql.Field{Type: graphql.String},
		"size": &graphql.Field{Type: graphql.String},
		"color": &graphql.Field{Type: graphql.String},
		"price": &graphql.Field{Type: graphql.String},
		"status": &graphql.Field{Type: graphql.String},
		"picture": &graphql.Field{Type: graphql.String},
		"sellerName": &graphql.Field{Type: graphql.String},
		"formattedSoldAt": &graphql.Field{Type: graphql.String},
	},
})


func QueryType() *graphql.Object {
	return graphql.NewObject(graphql.ObjectConfig{
		Name: "Query",
		Fields: graphql.Fields{
			"getUnsoldItems": &graphql.Field{
				Type:        graphql.NewList(itemDetailType),
				Description: "Get unsold items",
				Resolve: func(params graphql.ResolveParams) (interface{}, error) {
					
					merchant, ok := params.Context.Value("user").(models.User)
					if !ok {
						return nil, errors.New("unauthorized: user context is missing or invalid")
					}
					if !merchant.IsMerchant {
						return nil, errors.New("unauthorized: only merchants can get unsold item listings")
					}
					return controllers.GetUnsoldItems(merchant.ID)
				},
			},
			"getSoldItems": &graphql.Field{
				Type:        graphql.NewList(itemDetailType),
				Description: "Get sold items",
				Args: graphql.FieldConfigArgument{
					"startDate": &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
					"endDate":    &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
				},
				Resolve: func(params graphql.ResolveParams) (interface{}, error) {
					
					merchant, ok := params.Context.Value("user").(models.User)
					if !ok {
						return nil, errors.New("unauthorized: user context is missing or invalid")
					}
					if !merchant.IsMerchant {
						return nil, errors.New("unauthorized: only merchants can get sold item listings")
					}
					startDate := params.Args["startDate"].(string)
					endDate := params.Args["endDate"].(string)

					
					if _, err := time.Parse("2006-01-02", startDate); err != nil {
						return nil, errors.New("invalid start date format; use YYYY-MM-DD")
					}
					if _, err := time.Parse("2006-01-02", endDate); err != nil {
						return nil, errors.New("invalid end date format; use YYYY-MM-DD")
					}

					return controllers.GetSoldItems(startDate, endDate, merchant.ID)
				},
			},
			"getItems": &graphql.Field{
				Type:        graphql.NewList(itemToBeSoldType),
				Description: "Get to be sold items (for customers)",
				Args: graphql.FieldConfigArgument{
					"cursor": &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.Int)},
				},
				Resolve: func(params graphql.ResolveParams) (interface{}, error) {
					
					customer, ok := params.Context.Value("user").(models.User)
					if !ok {
						return nil, errors.New("unauthorized: user context is missing or invalid")
					}
					if customer.IsMerchant {
						return nil, errors.New("unauthorized: merchants cannot access this resource")
					}
					cursor := params.Args["cursor"].(int)
					if cursor < 0 {
						return nil, errors.New("invalid argument: cursor must be greater than or equal to 0")
					}
					return controllers.GetItems(cursor)
				},
			},
			"getHistory": &graphql.Field{
				Type:        graphql.NewList(itemHistory),
				Description: "Get customer's history",
				Resolve: func(params graphql.ResolveParams) (interface{}, error) {
					customer, ok := params.Context.Value("user").(models.User)
					if !ok {
						return nil, errors.New("unauthorized: user context is missing or invalid")
					}
					if customer.IsMerchant {
						return nil, errors.New("unauthorized: merchants cannot access this resource")
					}
					return controllers.GetHistory(customer.ID)
				},
			},
			
		},
	})
}


func MutationType() *graphql.Object {
	return graphql.NewObject(graphql.ObjectConfig{
		Name: "Mutation",
		Fields: graphql.Fields{
			"register": &graphql.Field{
				Type:        userType,
				Description: "Register a new user",
				Args: graphql.FieldConfigArgument{
					"name": &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
					"email":    &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
					"password": &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
					"isMerchant": &graphql.ArgumentConfig{Type: graphql.Boolean}, // Optional
				},
				Resolve: func(params graphql.ResolveParams) (interface{}, error) {
					name := params.Args["name"].(string)
					email := params.Args["email"].(string)
					password := params.Args["password"].(string)
					isMerchant, ok := params.Args["isMerchant"].(bool)
					if !ok {
						isMerchant = false 
					}
					return controllers.Register(name, email, password, isMerchant) 
				},
			},
			"login": &graphql.Field{
				Type:        userType,
				Description: "Login",
				Resolve: func(params graphql.ResolveParams) (interface{}, error) {
					user, ok := params.Context.Value("user").(models.User)
					if !ok {
						return nil, errors.New("user not found in context")
					}
					return user, nil
				},
			},
			"uploadItem": &graphql.Field{
				Type:        itemType, 
				Description: "Upload a new item",
				Args: graphql.FieldConfigArgument{
					"item": &graphql.ArgumentConfig{
						Type: graphql.NewNonNull(graphql.NewInputObject(graphql.InputObjectConfig{
							Name: "OneItemInput",
							Fields: graphql.InputObjectConfigFieldMap{
								"class":        &graphql.InputObjectFieldConfig{Type: graphql.NewNonNull(graphql.String)},
								"size":     &graphql.InputObjectFieldConfig{Type: graphql.NewNonNull(graphql.String)},
								"color":         &graphql.InputObjectFieldConfig{Type: graphql.NewNonNull(graphql.String)},
								"price":         &graphql.InputObjectFieldConfig{Type: graphql.NewNonNull(graphql.String)},
								"status":         &graphql.InputObjectFieldConfig{Type: graphql.NewNonNull(graphql.String)},
								"picture":     &graphql.InputObjectFieldConfig{Type: graphql.String},
							},
						})),
					},
				},
				Resolve: func(params graphql.ResolveParams) (interface{}, error) {
					
					merchant, ok := params.Context.Value("user").(models.User)
					if !ok {
						return nil, errors.New("unauthorized: user context is missing or invalid")
					}
					if merchant.IsMerchant {
						return nil, errors.New("unauthorized: only users can upload single item")
					}
					itemData, ok := params.Args["item"].(map[string]interface{})
					if !ok {
						return nil, errors.New("invalid item input")
					}
					fmt.Printf("Received GraphQL arguments: %+v\n", params.Args)
					fmt.Printf("Received GraphQL arguments: %+v\n", itemData)
					class := itemData["class"].(string)
					size := itemData["size"].(string)
					color := itemData["color"].(string)
					price := itemData["price"].(string)
					status := itemData["status"].(string)
					picture := itemData["picture"].(string)
					createdItem, err := controllers.CreateItem(class, size, color, price, status, picture, merchant.ID)
					if err != nil {
						return nil, err
					}
					return createdItem, nil
				},
			},
			"createItems": &graphql.Field{
				Type:        graphql.NewList(itemType), 
				Description: "Create a list of new item listings",
				Args: graphql.FieldConfigArgument{
					"items": &graphql.ArgumentConfig{
						Type: graphql.NewNonNull(graphql.NewList(graphql.NewInputObject(graphql.InputObjectConfig{
							Name: "ItemInput",
							Fields: graphql.InputObjectConfigFieldMap{
								"class":        &graphql.InputObjectFieldConfig{Type: graphql.NewNonNull(graphql.String)},
								"size":     &graphql.InputObjectFieldConfig{Type: graphql.NewNonNull(graphql.String)},
								"color":         &graphql.InputObjectFieldConfig{Type: graphql.NewNonNull(graphql.String)},
								"price":         &graphql.InputObjectFieldConfig{Type: graphql.NewNonNull(graphql.String)},
								"status":         &graphql.InputObjectFieldConfig{Type: graphql.NewNonNull(graphql.String)},
								"picture":     &graphql.InputObjectFieldConfig{Type: graphql.String},
							},
						}))),
					},
				},
				Resolve: func(params graphql.ResolveParams) (interface{}, error) {
					
					itemInputs := params.Args["items"].([]interface{})

					
					merchant, ok := params.Context.Value("user").(models.User)
					if !ok {
						return nil, errors.New("unauthorized: user context is missing or invalid")
					}
					if !merchant.IsMerchant {
						return nil, errors.New("unauthorized: only merchants can create item listings")
					}

					var createdItems []*models.Item
					for _, itemInput := range itemInputs {
						item := itemInput.(map[string]interface{})
						class := item["class"].(string)
						size := item["size"].(string)
						color := item["color"].(string)
						price := item["price"].(string)
						status := item["status"].(string)
						picture := item["picture"].(string)
						
						createdItem, err := controllers.CreateItem(class, size, color, price, status, picture, merchant.ID)
						if err != nil {
							return nil, err
						}
						createdItems = append(createdItems, createdItem)
					}
					return createdItems, nil
				},
			},
			"removeItem": &graphql.Field{
				Type:        itemType, 
				Description: "Remove a item by its ID",
				Args: graphql.FieldConfigArgument{
					"id": &graphql.ArgumentConfig{
						Type: graphql.NewNonNull(graphql.ID), 
					},
				},
				Resolve: func(params graphql.ResolveParams) (interface{}, error) {
					id, _ := params.Args["id"].(string)
					
					merchant, ok := params.Context.Value("user").(models.User)
					if !ok {
						return nil, errors.New("unauthorized: user context is missing or invalid")
					}
					if !merchant.IsMerchant {
						return nil, errors.New("unauthorized: only merchants can remove item listings")
					}
					
					return controllers.RemoveItem(id, merchant.ID)
					
				},
			},

			"buyItem": &graphql.Field{
				Type:        itemType, 
				Description: "Buy an item with id",
				Args: graphql.FieldConfigArgument{
					"id": &graphql.ArgumentConfig{
						Type: graphql.NewNonNull(graphql.Int), 
					},
				},
				Resolve: func(params graphql.ResolveParams) (interface{}, error) {
					id, _ := params.Args["id"].(int)
					
					customer, ok := params.Context.Value("user").(models.User)
					if !ok {
						return nil, errors.New("unauthorized: user context is missing or invalid")
					}
					if customer.IsMerchant {
						return nil, errors.New("unauthorized: only customers can buy items")
					}
					
					return controllers.BuyItem(id, customer.ID)
				},
			},

			"proceedItems": &graphql.Field{
				Type:        graphql.NewList(itemType), 
				Description: "Buy items in cart",
				Args: graphql.FieldConfigArgument{
					"ids": &graphql.ArgumentConfig{
						Type: graphql.NewNonNull(graphql.NewList(graphql.Int)),
					},
				},
				Resolve: func(params graphql.ResolveParams) (interface{}, error) {
					idsInterface, ok := params.Args["ids"].([]interface{})
					if !ok {
						return nil, errors.New("invalid argument: 'ids' must be a list of integers")
					}
					
					ids := make([]int, len(idsInterface))
					for i, id := range idsInterface {
						idInt, ok := id.(int)
						if !ok {
							return nil, errors.New("invalid argument: 'ids' must contain only integers")
						}
						ids[i] = idInt
					}
					
					customer, ok := params.Context.Value("user").(models.User)
					if !ok {
						return nil, errors.New("unauthorized: user context is missing or invalid")
					}
					if customer.IsMerchant {
						return nil, errors.New("unauthorized: only customers can buy items")
					}
					var items []*models.Item
					var errs string
					for _, id := range ids {
						item, err := controllers.BuyItem(id, customer.ID)
						if err != nil {
							errs += err.Error() + "\n"
							continue
						}
						items = append(items, item)
					}
					
					if errs != "" {
						return items, errors.New(errs)
					}
					
					return items, nil
				},
			},
		},
	})
}