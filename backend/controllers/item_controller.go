package controllers

import (
	"time"
	"errors"
	"backend/models" 
	"fmt"
)

type ItemWithMerchant struct {
    ID          int
    Class     string
    Size     string
	Color     string
	Price     string
	Status     string
    Picture     string
    SellerID  int
    IsSold      bool
    SellerName string 
	SoldAt       time.Time
	FormattedSoldAt string 
}

func CreateItem(class, size, color, price, status string, picture string, sellerID uint) (*models.Item, error){
	
	item := models.Item{
		Class:        class,
		Size:          size,
		Color:         color,
		Price:         price,
		Status:        status,
		Picture:     picture,
		SellerID:    sellerID,
		CreatedAt:   time.Now(),
		IsSold:      false, // Default to not sold
	}

	
	if err := models.DB.Create(&item).Error; err != nil {
		return nil, err
	}
	return &item, nil
}

func RemoveItem(id string, sellerID uint) (*models.Item, error) {
	var item models.Item

	
	if err := models.DB.First(&item, id).Error; err != nil {
		return nil, err
	}
	
	if item.SellerID != sellerID {
		return nil, errors.New("unauthorized: you can only delete items you created")
	}
	
	if item.IsSold {
		return nil, errors.New("cannot delete a item that has been sold")
	}
	
	if err := models.DB.Delete(&item).Error; err != nil {
		return nil, err
	}

	return &item, nil 
}

func BuyItem(id int, customerID uint) (*models.Item, error) {
	var item models.Item
	
	if err := models.DB.First(&item, id).Error; err != nil {
		return nil, err
	}
	
	if item.IsSold {
		return nil, fmt.Errorf("%v is already sold", item.Class)
	}
	
	if err := models.DB.Model(&item).
    Updates(map[string]interface{}{
        "is_sold": true,
        "sold_at": time.Now(),
		"sold_by": customerID,
    }).Error; err != nil {
    return nil, err
	}

	return &item, nil 
}

func GetUnsoldItems(sellerID uint) ([]*models.Item, error) {
	var unsoldItems []*models.Item

	
	err := models.DB.Where("is_sold = ? AND seller_id = ?", false, sellerID).Find(&unsoldItems).Error
	if err != nil {
		return nil, err
	}

	return unsoldItems, nil
}

func GetSoldItems(startDate, endDate string, sellerID uint) ([]*models.Item, error) {
	var soldItems []*models.Item
	
	err := models.DB.Where("is_sold = ? AND seller_id = ? AND DATE(sold_at) BETWEEN ? AND ?", true, sellerID, startDate, endDate).Find(&soldItems).Error
	if err != nil {
		return nil, err
	}
	return soldItems, nil
}

func GetItems(cursor int) ([]*ItemWithMerchant, error) {
	limit := 10
	var itemsWithMerchant []*ItemWithMerchant
	err := models.DB.Table("items").
		Select("items.*, users.name AS seller_name").
		Joins("JOIN users ON items.seller_id = users.id").
		Where("items.id > ? AND items.is_sold = ?", cursor, false).
		Order("items.id ASC").
		Limit(limit).
		Scan(&itemsWithMerchant).Error

	if err != nil {
		return nil, err
	}
	return itemsWithMerchant, nil
}

func GetHistory(customerID uint) ([]*ItemWithMerchant, error) {
	var itemsWithMerchant []*ItemWithMerchant
	err := models.DB.Table("items").
		Select("items.*, users.name AS seller_name").
		Joins("JOIN users ON items.seller_id = users.id").
		Where("items.is_sold = ? AND items.sold_by = ?", true, customerID).
		Order("items.sold_at DESC").
		Scan(&itemsWithMerchant).Error

	if err != nil {
		return nil, err
	}
	// Load the PST location
	pstLocation, err := time.LoadLocation("America/Los_Angeles")
	if err != nil {
		fmt.Println("Error loading location:", err)
		return nil, err
	}
	for _, item := range itemsWithMerchant {
        item.FormattedSoldAt = item.SoldAt.In(pstLocation).Format("2006-01-02 15:04")
    }
	return itemsWithMerchant, nil
}