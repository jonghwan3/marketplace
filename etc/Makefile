GRAPHQL_ENDPOINT := http://localhost:8080/graphql
REGISTER_ENDPOINT := http://localhost:8080/register
AUTH1 := wilson@gmail.com:wilson
AUTH2 := ray@gmail.com:ray
USER1 := user1@gmail.com:user

registerWilson:
	curl -X POST $(REGISTER_ENDPOINT) \
	-H "Content-Type: application/json" \
	-d "{ \
	  \"query\": \"mutation register(\$$name: String!, \$$email: String!, \$$password: String!, \$$isMerchant: Boolean!) { register(name: \$$name, email: \$$email, password: \$$password, isMerchant: \$$isMerchant) { id name email } }\", \
	  \"variables\": { \
	    \"name\": \"Wilson Corp\", \
	    \"email\": \"wilson@gmail.com\", \
	    \"password\": \"wilson\", \
	    \"isMerchant\": true \
	  } \
	}"

registerRay:
	curl -X POST $(REGISTER_ENDPOINT) \
	-H "Content-Type: application/json" \
	-d "{ \
	  \"query\": \"mutation register(\$$name: String!, \$$email: String!, \$$password: String!, \$$isMerchant: Boolean!) { register(name: \$$name, email: \$$email, password: \$$password, isMerchant: \$$isMerchant) { id name email } }\", \
	  \"variables\": { \
	    \"name\": \"Ray Corp\", \
	    \"email\": \"ray@gmail.com\", \
	    \"password\": \"ray\", \
	    \"isMerchant\": true \
	  } \
	}"

registerCustomer:
	curl -X POST $(REGISTER_ENDPOINT) \
	-H "Content-Type: application/json" \
	-d "{ \
	  \"query\": \"mutation register(\$$name: String!, \$$email: String!, \$$password: String!, \$$isMerchant: Boolean!) { register(name: \$$name, email: \$$email, password: \$$password, isMerchant: \$$isMerchant) { id name email } }\", \
	  \"variables\": { \
	    \"name\": \"Customer1\", \
	    \"email\": \"user1@gmail.com\", \
	    \"password\": \"user\", \
	    \"isMerchant\": false \
	  } \
	}"

removeWilsonItem:
	curl -X POST $(GRAPHQL_ENDPOINT) \
	-u "$(AUTH1)" \
	-H "Content-Type: application/json" \
	-d "{\"query\":\"mutation removeItem(\$$id: ID!) { removeItem(id: \$$id) { id class size color price status } }\", \
		\"variables\":{\"id\": 4} \
		}"

removeRayItem:
	curl -X POST $(GRAPHQL_ENDPOINT) \
	-u "$(AUTH2)" \
	-H "Content-Type: application/json" \
	-d "{\"query\":\"mutation removeItem(\$$id: ID!) { removeItem(id: \$$id) { id class size color price status } }\", \
		\"variables\":{\"id\": 14} \
		}"

removeDifferentMerchantItem:
	curl -X POST $(GRAPHQL_ENDPOINT) \
	-u "$(AUTH1)" \
	-H "Content-Type: application/json" \
	-d "{\"query\":\"mutation removeItem(\$$id: ID!) { removeItem(id: \$$id) { id class size color price status } }\", \
		\"variables\":{\"id\": 15} \
		}"

getUnsoldWilsonItems:
	curl -X POST $(GRAPHQL_ENDPOINT) \
		-u "$(AUTH1)" \
		-H "Content-Type: application/json" \
		-d '{"query":"query getUnsoldItems { getUnsoldItems { id class size color price status picture createdAt sellerID isSold soldAt } }"}'

getSoldWilsonItems:
	curl -X POST $(GRAPHQL_ENDPOINT) \
		-u "$(AUTH1)" \
		-H "Content-Type: application/json" \
		-d '{"query":"query getSoldItems($$startDate: String!, $$endDate: String!) { getSoldItems(startDate: $$startDate, endDate: $$endDate) { id class size color price status picture createdAt sellerID isSold soldAt } }", \
		     "variables": { "startDate": "2025-01-01", "endDate": "2025-01-30" }}'

getAllItemsFromMerchant:
	curl -X POST $(GRAPHQL_ENDPOINT) \
		-u "$(AUTH1)" \
		-H "Content-Type: application/json" \
		-d '{"query":"query getItems($$cursor: Int!) { getItems(cursor: $$cursor) { id picture class size color price status sellerName } }", \
		     "variables": { "cursor": 0 }}'

getUnsoldWilsonItemsFromCustomer:
	curl -X POST $(GRAPHQL_ENDPOINT) \
		-u "$(USER1)" \
		-H "Content-Type: application/json" \
		-d '{"query":"query getUnsoldItems { getUnsoldItems { id class size color price status picture createdAt sellerID isSold soldAt } }"}'

createItemsWilson:
	curl -X POST $(GRAPHQL_ENDPOINT) \
	-u "$(AUTH1)" \
	-H "Content-Type: application/json" \
	-d @items_1.json

createItemsRay:
	curl -X POST $(GRAPHQL_ENDPOINT) \
	-u "$(AUTH2)" \
	-H "Content-Type: application/json" \
	-d @items_2.json