package models

import (
	"fmt"
	"log"
	"os"
	"time"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"github.com/joho/godotenv"
)

var DB *gorm.DB

func ConnectDatabase() {
	// Load .env file (note that default directory on the server is backend/main.go)
	err := godotenv.Load()
	if err != nil {
		log.Fatalf("Error loading .env file: %v", err)
	}

	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	dbname := os.Getenv("DB_NAME")
	port := os.Getenv("DB_PORT")

	// For local
	dsn := fmt.Sprintf("host=localhost user=%s password=%s dbname=%s port=%s sslmode=disable",
					   user, password, dbname, port)
	// For docker
	// dsn := fmt.Sprintf("host=postgres user=%s password=%s dbname=%s port=%s sslmode=disable",
	// 				   user, password, dbname, port)

	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	fmt.Println("Database connected successfully")

	DB.AutoMigrate(&User{}, &Item{}) // Replace with your models
}

type User struct {
	ID        uint      `gorm:"primaryKey"`
	Name      string    `gorm:"size:100"`
	Email     string    `gorm:"size:100;unique;not null"`
	Password  string    `gorm:"not null"`
	CreatedAt time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP"`
	IsMerchant bool      `gorm:"type:boolean;default:false"`
}

type Item struct {
    ID          uint       `gorm:"primaryKey"`                             
    Class       string     `gorm:"size:100;not null"`                      
    Size        string     `gorm:"size:100;not null"`                      
	Color       string     `gorm:"size:100;not null"`                      
	Price       string     `gorm:"size:100;not null"`                      
	Status      string     `gorm:"size:100;not null"`                      
    Picture     string     `gorm:"type:text"`                              
    CreatedAt   time.Time  `gorm:"type:timestamp;default:CURRENT_TIMESTAMP"` 
    IsSold      bool       `gorm:"type:boolean;default:false"`             
    SoldAt      *time.Time `gorm:"type:timestamp"`                        
    SellerID    uint       `gorm:"index"`                                  
    SoldBy      *uint      `gorm:"index"`                      
}
