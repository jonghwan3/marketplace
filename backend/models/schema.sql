CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_merchant BOOLEAN DEFAULT FALSE
);

CREATE TABLE items (
    id SERIAL PRIMARY KEY,                      
    class VARCHAR(100) NOT NULL,                
    size VARCHAR(100) NOT NULL,                
    color VARCHAR(100) NOT NULL,                
    price VARCHAR(100) NOT NULL,                
    status VARCHAR(100) NOT NULL,                
    picture TEXT,                              -- URL of the picture
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    is_sold BOOLEAN DEFAULT FALSE,             
    sold_at TIMESTAMP,                         
    seller_id INT REFERENCES users(id) ON DELETE SET NULL, 
    sold_by INT REFERENCES users(id) ON DELETE SET NULL 
);