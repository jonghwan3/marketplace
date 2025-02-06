package controllers

import (
	"strings"
	"golang.org/x/crypto/bcrypt"
	"errors"
	
	"backend/models" 
)


func Register(name, email, password string, isMerchant bool) (*models.User, error) {
	
	user := models.User{
		Name:     name,
		Email:    email,
		IsMerchant: isMerchant,
	}
	
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, errors.New("failed to hash password")
	}
	user.Password = string(hashedPassword)

	
	if err := models.DB.Create(&user).Error; err != nil {
		if strings.Contains(err.Error(), "duplicate key value violates unique constraint") {
			return nil, errors.New("you have already registered")
		}
		return nil, err
	}
	return &user, nil
}
