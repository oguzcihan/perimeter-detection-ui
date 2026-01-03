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
import { useTranslation } from "react-i18next";
import api from "../services/api";

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

            const response = await api.post("/token", formData);

            const { access_token } = response.data;

            // Set token temporarily to allow fetching user details
            localStorage.setItem("access_token", access_token);
            // api interceptor handles adding token to future requests

            // Fetch user details including email
            const { getCurrentUser } = await import("../services/userService");
            const user = await getCurrentUser();

            login(access_token, user);
            navigate("/dashboard");
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
