// api.ts
import {
    GraphQLResponse,
    UserProfileResponse,
    ProjectDetailsResponse,
    ProcessedUserData,
    AuthResponse
} from './types';

const BASE_URL = 'https://learn.reboot01.com';

export const login = async (username: string, password: string): Promise<string> => {
    try {
        const credentials = btoa(`${username}:${password}`);
        const response = await fetch(`${BASE_URL}/api/auth/signin`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`
            }
        });

        if (!response.ok) {
            throw new Error('Invalid credentials');
        }

        const data = await response.json();
        localStorage.setItem('token', data);
        console.log('Token saved:', data);  // Debugging

        return data;

    } catch (error) {
        throw new Error(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

export const logout = (): void => {
    localStorage.removeItem('token');
};

const fetchGraphQL = async <T>(query: string, variables: Record<string, unknown> = {}): Promise<T> => {
    const token = localStorage.getItem('token');
    console.log('Token:', token);
    
    if (!token) {
        throw new Error('No authentication token found');
    }

    try {
        const response = await fetch(`${BASE_URL}/api/graphql-engine/v1/graphql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                query,
                variables
            })
        });

        if (!response.ok) {
            throw new Error('GraphQL request failed');
        }

        const data = await response.json() as GraphQLResponse<T>;
        if (data.errors) {
            throw new Error(data.errors[0].message);
        }

        return data.data;
    } catch (error) {
        throw new Error(`GraphQL query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

const queries = {
    getUserProfile: `
        query GetUserProfile {
            user {
                id
                login
                transactions(where: {type: {_eq: "xp"}}, order_by: {createdAt: asc}) {
                    id
                    amount
                    createdAt
                    path
                }
                progresses(order_by: {createdAt: asc}) {
                    id
                    grade
                    createdAt
                    path
                }
                results(order_by: {createdAt: asc}) {
                    id
                    grade
                    createdAt
                    path
                }
            }
        }
    `,

    getProjectDetails: `
        query GetProjectDetails($objectId: Int!) {
            object(where: {id: {_eq: $objectId}}) {
                id
                name
                type
            }
        }   
    `
};

export const processUserData = (rawData: UserProfileResponse): ProcessedUserData => {
    if (!rawData.user || !Array.isArray(rawData.user) || rawData.user.length === 0) {
        throw new Error('No user data found');
    }

    const user = rawData.user[0]; // Access the first user safely

    const totalXP = user.transactions.reduce((sum: number, tx: { amount: number }) => sum + tx.amount, 0);
   
    const auditRatio = 0

    // Process XP progress over time
    const xpProgress = user.transactions.reduce((acc: Array<{ month: string; xp: number }>, tx: { createdAt: string; amount: number }) => {
        const date = new Date(tx.createdAt);
        const month = date.toLocaleString('default', { month: 'short' });
        const existingMonth = acc.find((m: { month: string; xp: number }) => m.month === month);

        if (existingMonth) {
            existingMonth.xp += tx.amount;
        } else {
            acc.push({ month, xp: tx.amount });
        }
        return acc;
    }, [] as Array<{ month: string; xp: number }>);

    // Calculate project statistics
    const projectResults = user.results.filter((r: { path: string }) => !r.path.includes('audit'));
    const passCount = projectResults.filter((r: { grade: number }) => r.grade === 1).length;
    const failCount = projectResults.filter((r: { grade: number }) => r.grade === 0).length;

    const projectStats = [
        { name: 'Pass', value: passCount },
        { name: 'Fail', value: failCount }
    ];

    return {
        login: user.login,
        totalXP,
        auditRatio,
        completedProjects: passCount + failCount,
        xpData: xpProgress,
        projectStats
    };
};

export const fetchUserProfile = async (): Promise<ProcessedUserData> => {
    try {
        console.log('Fetching user profile data...');
        const data = await fetchGraphQL<UserProfileResponse>(queries.getUserProfile);
        console.log('Raw GraphQL response:', data);

        if (!data || !Array.isArray(data.user) || data.user.length === 0) {
            throw new Error('No user data received from GraphQL');
        }

        const processedData = processUserData(data);
        console.log('Processed user data:', processedData);
        return processedData;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        throw error;
    }
};

export const fetchProjectDetails = async (objectId: number) => {
    const data = await fetchGraphQL<ProjectDetailsResponse>(
        queries.getProjectDetails,
        { objectId }
    );
    return data.object;
};
