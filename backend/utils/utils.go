package utils

import (
	"fmt"
	"log"
	"os"
	"time"
	"strconv"
	"github.com/golang-jwt/jwt/v4"
	"github.com/joho/godotenv"
)

var jwtKey []byte

func jwtKeyInit() {
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: Error loading .env file, environment variables will be used instead")
	}

	secretKey := os.Getenv("SECRET_KEY")
	if secretKey == "" {
		log.Fatal("SECRET_KEY is not set in .env or environment variables")
	}

	jwtKey = []byte(secretKey)
}

func GenerateToken(userID uint) (string, error) {
	jwtKeyInit()
	claims := &jwt.StandardClaims{
		Subject:   fmt.Sprint(userID),
		ExpiresAt: time.Now().Add(24 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtKey)
}

func ParseToken(tokenString string) (uint, error) {
	jwtKeyInit()
	token, err := jwt.ParseWithClaims(tokenString, &jwt.StandardClaims{}, func(token *jwt.Token) (interface{}, error) {

		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return jwtKey, nil
	})

	if err != nil {
		return 0, err 
	}

	
	if claims, ok := token.Claims.(*jwt.StandardClaims); ok && token.Valid {
	
		userID, err := strconv.ParseUint(claims.Subject, 10, 32)
		if err != nil {
			return 0, fmt.Errorf("invalid userID in token: %v", err)
		}
		return uint(userID), nil
	}

	return 0, fmt.Errorf("invalid token")
}