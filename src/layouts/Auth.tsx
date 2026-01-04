import React from "react";
import { useLocation } from "react-router-dom";
// reactstrap components
import { Container } from "reactstrap";

import Login from "../views/Login.tsx";
import Register from "../views/Register.tsx";
import { LanguageSwitcher } from "../components/LanguageSwitcher.tsx";

function Auth() {
    const location = useLocation();
    React.useEffect(() => {
        document.body.classList.add("login-page");
        return function cleanup() {
            document.body.classList.remove("login-page");
        };
    }, []);

    return (
        <div className="wrapper wrapper-full-page h-full min-h-screen relative">
            <div className="absolute top-4 right-4 z-50">
                <LanguageSwitcher direction="down" />
            </div>
            <div className="auth-background w-full h-full min-h-screen flex items-center justify-center py-10 px-4">
                <Container className="w-full max-w-md mx-auto">
                    <div className="auth-title">
                        <h3 className="text-2xl md:text-3xl lg:text-4xl text-center mb-6 break-words">Perimeter Detection System</h3>
                    </div>
                    {location.pathname === '/register' ? <Register /> : <Login />}
                </Container>
            </div>
        </div>
    );
}

export default Auth;
