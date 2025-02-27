const AUTH_API = 'https://learn.reboot01.com/api/auth/signin';
const GRAPHQL_API = 'https://learn.reboot01.com/api/graphql-engine/v1/graphql';

// Login function
export const login = async (identifier, password) => {
  try {
    const credentials = `${identifier}:${password}`;
    const encodedCredentials = btoa(credentials);

    console.log("Sending Login Request...");

    const response = await fetch(AUTH_API, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${encodedCredentials}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Login failed with status:", response.status, "Response:", errorText);
      throw new Error(`Login failed: ${response.status} - ${errorText}`);
    }

    const rawBody = await response.text();
    console.log("Raw Response Body:", rawBody);

    let token;
    try {
      const data = JSON.parse(rawBody);
      console.log("Parsed JSON Response:", data);
      token = data.token || data.access_token || data.jwt || data.auth_token;
      if (!token) {
        console.error("No token found in JSON response:", data);
        throw new Error("Authentication failed: No token field found in response.");
      }
    } catch (jsonError) {
      console.log("Response is not JSON, treating as plain token:", rawBody);
      token = rawBody.trim().replace(/^"|"$/g, ''); // Remove quotes and whitespace
      if (!token.includes('.')) {
        console.error("Response does not appear to be a valid token:", token);
        throw new Error("Authentication failed: Invalid token format.");
      }
    }

    console.log("Received Token:", token);
    return token;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Execute GraphQL query
export const executeQuery = async (query, variables = {}, token) => {
  try {
    console.log("Token sent to GraphQL API:", token);
    console.log("Token length:", token.length);
    console.log("Token parts:", token.split('.').length);

    const response = await fetch(GRAPHQL_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.trim()}`
      },
      body: JSON.stringify({ query, variables })
    });

    console.log("GraphQL Response Status:", response.status);

    const result = await response.json();
    console.log("GraphQL Response Data:", result);

    if (result.errors) {
      console.error("GraphQL Errors:", result.errors);
      throw new Error(result.errors[0].message);
    }

    return result.data;
  } catch (error) {
    console.error('GraphQL query error:', error);
    throw error;
  }
};

// GraphQL queries
export const QUERY_USER_INFO = `
  query GetUserInfo {
    user {
      id
      login
    }
  }
`;

export const QUERY_USER_XP = `
  query GetUserXP {
    transaction(where: {type: {_eq: "xp"}}, order_by: {createdAt: asc}) {
      id
      amount
      createdAt
      path
    }
  }
`;

export const QUERY_USER_PROJECTS = `
  query GetUserProjects {
    progress(order_by: {createdAt: desc}) {
      id
      objectId
      grade
      createdAt
      path
    }
  }
`;

export const QUERY_USER_AUDITS = `
  query GetUserAudits {
    transaction(where: {type: {_in: ["up", "down"]}}) {
      id
      type
      amount
      createdAt
    }
  }
`;