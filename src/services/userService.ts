import api from './api';

export interface UserRead {
    id: number;
    email: string;
    username: string;
}

export interface UpdateProfileData {
    username?: string;
    email?: string;
    current_password: string;
}

export interface UpdatePasswordData {
    current_password: string;
    new_password: string;
}

export const updateProfile = async (data: any) => {
    // Legacy method - keeping for compatibility if referenced elsewhere, though we likely replaced usage
    const response = await api.put('/api/v1/users/me', data);
    return response.data;
};

export const updateProfileInfo = async (data: UpdateProfileData) => {
    const response = await api.put('/api/v1/users/me/profile', data);
    return response.data;
};

export const updateUserPassword = async (data: UpdatePasswordData) => {
    const response = await api.put('/api/v1/users/me/password', data);
    return response.data;
};

export const getCurrentUser = async (): Promise<UserRead> => {
    const response = await api.get('/api/v1/users/me');
    return response.data;
};

export const loginUser = async (username: string, password: string): Promise<{ access_token: string; token_type: string }> => {
    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);
    const response = await api.post('/api/v1/token', formData);
    return response.data;
};
