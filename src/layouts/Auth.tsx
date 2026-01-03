import React from "react";
import { useLocation } from "react-router-dom";
// reactstrap components
import { Container } from "reactstrap";

import Login from "../views/Login.tsx";
import Register from "../views/Register.tsx";

function Auth() {
    const location = useLocation();
    React.useEffect(() => {
        document.body.classList.add("login-page");
        return function cleanup() {
            document.body.classList.remove("login-page");
        };
    }, []);

    return (
        <div className="wrapper wrapper-full-page">
            <div className="auth-background">
                <Container>
                    <div className="auth-title">
                        <h3>Perimeter Detection System</h3>
                    </div>
                    {location.pathname === '/register' ? <Register /> : <Login />}
                </Container>
            </div>
        </div>
    );
}

export default Auth;
