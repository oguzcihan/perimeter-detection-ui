import React, { useState } from "react";
import {
    Button,
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    CardTitle,
    Form,
    Input,
    InputGroup,
    InputGroupText,
    Container,
    Col,
    Row,
    Alert
} from "reactstrap";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";
import axios from "axios";
import { useTranslation } from "react-i18next";

function Login() {
    const { t } = useTranslation();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            const formData = new FormData();
            formData.append("username", username);
            formData.append("password", password);

            const response = await axios.post("http://localhost:8000/api/v1/token", formData);

            const { access_token } = response.data;

            // Temporary token set for the request
            localStorage.setItem('access_token', access_token);

            // Fetch validation and full user details
            try {
                const { getCurrentUser } = await import("../services/userService");
                const userData = await getCurrentUser();
                login(access_token, userData);
                navigate("/dashboard");
            } catch (userError) {
                console.error("Failed to fetch user details", userError);
                setError("Login succeeded but failed to load user profile.");
            }
        } catch (err: any) {
            console.error("Login failed", err);
            if (err.response && err.response.status === 401) {
                setError(t('auth.error_invalid_credentials'));
            } else {
                setError(t('auth.error_login_generic'));
            }
        }
    };

    return (
        <div className="login-page">
            <Container>
                <Row>
                    <Col className="ml-auto mr-auto" lg="4" md="6">
                        <Form onSubmit={handleLogin} className="form" >
                            <Card className="card-glass" style={{ width: '100%' }}>
                                <CardHeader>
                                    <CardTitle tag="h3" className="header text-center">{t('auth.login_title')}</CardTitle>
                                </CardHeader>
                                <CardBody>
                                    {error && <Alert color="danger">{error}</Alert>}
                                    <InputGroup className="input-tech">
                                        <InputGroupText>
                                            <i className="nc-icon nc-single-02" />
                                        </InputGroupText>
                                        <Input
                                            placeholder={t('auth.username')}
                                            type="text"
                                            value={username}
                                            onChange={e => setUsername(e.target.value)}
                                            required
                                        />
                                    </InputGroup>
                                    <InputGroup className="mt-3 input-tech">
                                        <InputGroupText>
                                            <i className="nc-icon nc-key-25" />
                                        </InputGroupText>
                                        <Input
                                            placeholder={t('auth.password')}
                                            type="password"
                                            autoComplete="off"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            required
                                        />
                                    </InputGroup>
                                </CardBody>
                                <CardFooter>
                                    <Button
                                        block
                                        className="btn-tech mb-3"
                                        type="submit"
                                    >
                                        {t('auth.login_button')}
                                    </Button>
                                    <div className="text-center">
                                        <Link to="/register" className="text-muted" style={{ color: '#aaa' }}>{t('auth.create_account')}</Link>
                                    </div>
                                </CardFooter>
                            </Card>
                        </Form>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}

export default Login;
