import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfileInfo, updateUserPassword } from '../services/userService';
import { toast } from 'react-toastify';
import { FaUser, FaLock, FaSave, FaEnvelope } from 'react-icons/fa';
import classNames from 'classnames';

const EditProfile: React.FC = () => {
    const { user, login, logout } = useAuth();

    // Tab State
    const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

    // Profile Form State
    const [username, setUsername] = useState(user?.username || '');
    const [email, setEmail] = useState(user?.email || '');
    const [currentPasswordProfile, setCurrentPasswordProfile] = useState('');

    // Fetch latest user data on mount
    React.useEffect(() => {
        const fetchUserData = async () => {
            try {
                const { getCurrentUser } = await import("../services/userService");
                const userData = await getCurrentUser();
                setUsername(userData.username);
                setEmail(userData.email);
            } catch (error) {
                console.error("Failed to fetch fresh user data", error);
            }
        };
        fetchUserData();
    }, []);

    // Password Form State
    const [currentPasswordSecurity, setCurrentPasswordSecurity] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // UI State
    const [loading, setLoading] = useState(false);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!currentPasswordProfile) {
            toast.error("Current password is required to update profile.");
            setLoading(false);
            return;
        }

        try {
            const data = {
                username,
                email,
                current_password: currentPasswordProfile
            };

            await updateProfileInfo(data);

            toast.success("Profile updated successfully");

            // Renew token using new username and current password
            try {
                const { loginUser } = await import("../services/userService");
                const { access_token } = await loginUser(username, currentPasswordProfile);
                console.log("Renewed token received:", access_token.substring(0, 10) + "...");

                // Update api header and context
                localStorage.setItem("access_token", access_token);
                // Need to update API header immediately for subsequent requests if any
                const { default: api } = await import("../services/api");
                api.defaults.headers.common["Authorization"] = "Bearer " + access_token;

                login(access_token, { username, email });
            } catch (loginError) {
                console.error("Failed to renew token after profile update", loginError);
                toast.warning("Profile updated, but session refresh failed. Please login again.");
            }

            setCurrentPasswordProfile('');

        } catch (error: any) {
            console.error("Failed to update profile", error);
            if (error.response) {
                // FastAPI typically returns detailed errors in 'detail'
                const detail = error.response.data?.detail;
                if (detail) {
                    toast.error(detail);
                } else if (error.response.data?.message) {
                    toast.error(error.response.data.message);
                } else {
                    toast.error("Failed to update profile. Please check your inputs.");
                }
            } else {
                toast.error("Network error. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match.");
            setLoading(false);
            return;
        }

        try {
            const data = {
                current_password: currentPasswordSecurity,
                new_password: newPassword
            };

            await updateUserPassword(data);

            toast.success("Password updated successfully. Please login with your new password.");

            // Logout and redirect to login
            logout();
            window.location.href = "/login";

        } catch (error: any) {
            console.error("Failed to update password", error);
            if (error.response) {
                const detail = error.response.data?.detail;
                if (detail) {
                    toast.error(detail);
                } else if (error.response.data?.message) {
                    toast.error(error.response.data.message);
                } else {
                    toast.error("Failed to update password.");
                }
            } else {
                toast.error("Network error.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Edit Profile</h1>
                    <p className="text-slate-400 text-sm">Update your personal information and security settings</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-lg">

                        {/* Tabs */}
                        <div className="flex border-b border-slate-700">
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={classNames(
                                    "flex-1 py-4 text-sm font-medium text-center transition-colors relative",
                                    activeTab === 'profile' ? "text-emerald-400 bg-slate-800" : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/30"
                                )}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <FaUser /> Profile Info
                                </div>
                                {activeTab === 'profile' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500"></div>}
                            </button>
                            <button
                                onClick={() => setActiveTab('password')}
                                className={classNames(
                                    "flex-1 py-4 text-sm font-medium text-center transition-colors relative",
                                    activeTab === 'password' ? "text-emerald-400 bg-slate-800" : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/30"
                                )}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <FaLock /> Security
                                </div>
                                {activeTab === 'password' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500"></div>}
                            </button>
                        </div>

                        <div className="p-6">
                            {/* Profile Tab */}
                            {activeTab === 'profile' && (
                                <form onSubmit={handleProfileUpdate} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-slate-300">
                                                Username
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <FaUser className="text-slate-500" />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={username}
                                                    onChange={(e) => setUsername(e.target.value)}
                                                    className="w-full rounded-lg bg-slate-900 border border-slate-700 pl-10 pr-4 py-2 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-slate-300">
                                                Email Address
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <FaEnvelope className="text-slate-500" />
                                                </div>
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className="w-full rounded-lg bg-slate-900 border border-slate-700 pl-10 pr-4 py-2 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-slate-700 pt-6">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-slate-300">
                                                Current Password <span className="text-emerald-500 text-xs">(Required to save changes)</span>
                                            </label>
                                            <input
                                                type="password"
                                                value={currentPasswordProfile}
                                                onChange={(e) => setCurrentPasswordProfile(e.target.value)}
                                                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-2 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-2 flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 hover:shadow-emerald-500/30 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                                        >
                                            {loading ? (
                                                <>
                                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <FaSave /> Save Profile
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Password Tab */}
                            {activeTab === 'password' && (
                                <form onSubmit={handlePasswordUpdate} className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-slate-300">
                                                Current Password
                                            </label>
                                            <input
                                                type="password"
                                                value={currentPasswordSecurity}
                                                onChange={(e) => setCurrentPasswordSecurity(e.target.value)}
                                                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-2 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-slate-300">
                                                New Password
                                            </label>
                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-2 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-slate-300">
                                                Confirm New Password
                                            </label>
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-2 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 hover:shadow-emerald-500/30 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                                        >
                                            {loading ? (
                                                <>
                                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                                    Updating...
                                                </>
                                            ) : (
                                                <>
                                                    <FaLock /> Update Password
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>

                {/* Info Panel */}
                <div className="space-y-6">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-lg">
                        <div className="p-4 border-b border-slate-700 bg-slate-900/50 flex items-center gap-3">
                            {/* Change icon based on tab */}
                            {activeTab === 'profile' ? <FaUser className="text-blue-400 text-xl" /> : <FaLock className="text-blue-400 text-xl" />}
                            <h3 className="font-semibold text-white m-0 leading-none">
                                {activeTab === 'profile' ? "Profile Help" : "Security Recommendations"}
                            </h3>
                        </div>
                        <div className="p-6 text-sm text-slate-300 space-y-4">
                            {activeTab === 'profile' ? (
                                <>
                                    <p>
                                        Update your contact information so we can reach you for important system alerts.
                                    </p>
                                    <div className="p-3 rounded bg-slate-900/50 border border-slate-700/50">
                                        <strong className="block text-emerald-400 mb-1">Change Confirmation</strong>
                                        Changes to email or username require your current password for security verification.
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p>
                                        Regularly updating your password helps protect your perimeter detection system.
                                    </p>
                                    <div className="p-3 rounded bg-slate-900/50 border border-slate-700/50">
                                        <strong className="block text-emerald-400 mb-1">Strong Passwords</strong>
                                        Use at least 8 characters, including uppercase, numbers, and special symbols.
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditProfile;
