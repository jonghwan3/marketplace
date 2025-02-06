import axios, { AxiosResponse } from 'axios';

const API_URL = "http://localhost:8080/graphql";
const API_REGISTER_URL = "http://localhost:8080/register";
const API_UPLOAD_URL = "http://localhost:8000";


interface UserData {
  name?: string;
  email: string;
  password: string;
}

interface PayLoad {
  object: SelectedObject;
  cropped_image: string; // Base64 encoded image as a string
}

interface SelectedObject {
  class: string;
  confidence: number;
  bbox: [number, number, number, number]; // Bounding box coordinates [x_min, y_min, x_max, y_max]
}

interface ItemInferenced {
  class: string;
  size: string;
  color: string;
  estimatedPrice: string;
  status: string;
  picture: string;
};

export const registerUser = async (userData: UserData): Promise<AxiosResponse<any>> => {
  const mutation = `
    mutation register($name: String!, $email: String!, $password: String!, $isMerchant: Boolean!) {
      register(name: $name, email: $email, password: $password, isMerchant: $isMerchant) {
        id
        name
        email
      }
    }
  `;

  return await axios.post(API_REGISTER_URL, {
    query: mutation,
    variables: {
      name: userData.name, // Map "name" to GraphQL's "username"
      email: userData.email,
      password: userData.password,
      isMerchant: false,
    },
  });
};
export const loginUser = async (token: String): Promise<AxiosResponse<any>> => {
  const mutation = `
    mutation login {
      login {
        id
        name
        email
      }
    }
  `;

  return await axios.post(API_URL, { query: mutation },
    {
      headers: {
        Authorization: `Basic ${token}`, // Include token in Authorization header
        "Content-Type": "application/json",
      },
    });
};
export const getItems = async (cursor: number, token: string): Promise<AxiosResponse<any>> => {
  const query = `
    query getItems($cursor: Int!) {
      getItems(cursor: $cursor) {
        id
        picture
        class
        size
        color
        price
        status
        sellerName
      }
    }
  `;

  return await axios.post(API_URL, { query: query, variables: { cursor: cursor,} },
    {
      headers: {
        Authorization: `Basic ${token}`, // Include token in Authorization header
        "Content-Type": "application/json",
      },
    });
};

export const getHistory = async (token: string): Promise<AxiosResponse<any>> => {
  const query = `
    query getHistory {
      getHistory{
        id
        picture
        class
        size
        color
        price
        status
        sellerName
        formattedSoldAt
      }
    }
  `;

  return await axios.post(API_URL, { query: query, },
    {
      headers: {
        Authorization: `Basic ${token}`, // Include token in Authorization header
        "Content-Type": "application/json",
      },
    });
};


export const buyItem = async (id: number, token: string): Promise<AxiosResponse<any>> => {
  const mutation = `
  mutation buyItem($id: Int!) {
    buyItem(id: $id) {
        id
        class
        sellerID
      }
    }
  `;

  return await axios.post(API_URL, { query: mutation, variables: { id: id,} },
    {
      headers: {
        Authorization: `Basic ${token}`, // Include token in Authorization header
        "Content-Type": "application/json",
      },
    });
};

export const proceedItems = async (ids: number[], token: string): Promise<AxiosResponse<any>> => {
  const mutation = `
  mutation proceedItems($ids: [Int]!) {
    proceedItems(ids: $ids) {
        id
        class
        sellerID
      }
    }
  `;

  return await axios.post(API_URL, { query: mutation, variables: { ids: ids,} },
    {
      headers: {
        Authorization: `Basic ${token}`, // Include token in Authorization header
        "Content-Type": "application/json",
      },
    });
};

export const detectItem = async (formData: FormData) => {
  return await fetch(`${API_UPLOAD_URL}/detect_objects/`, {
    method: "POST",
    body: formData,
  });
};

export const sendItem = async (payload: PayLoad) => {
  return await fetch(`${API_UPLOAD_URL}/selected_object/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export const uploadImage = async (file: string) => {
  return await fetch(`${API_UPLOAD_URL}/upload_image/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base64_image: file }),
  });
};

export const uploadItem = async (input: ItemInferenced, token: string): Promise<AxiosResponse<any>> =>  {
  const mutation = `
  mutation uploadItem($item: OneItemInput!) {
    uploadItem(item: $item) {
      id
      class
      sellerID
    }
  }
  `;
  
  return await axios.post(API_URL, { 
    query: mutation, 
    variables: { 
      item: {
        class: input.class,
        size: input.size,
        color: input.color,
        price: input.estimatedPrice,  // Change "estimatedPrice" to "price" to match Go schema
        status: input.status,
        picture: input.picture,
      }
    }
  },
  {
      headers: {
        Authorization: `Basic ${token}`, 
        "Content-Type": "application/json",
      },
  });
}