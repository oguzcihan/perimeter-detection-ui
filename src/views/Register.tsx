import React, { useState } from "react";
import { FiUser, FiLock, FiMail } from "react-icons/fi";
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
import { useTranslation } from "react-i18next";
import api from "../services/api";

function Register() {
    const { t } = useTranslation();
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            await api.post("/api/v1/register", {
                email,
                username,
                password
            });
            navigate("/login");
        } catch (err: any) {
            console.error("Registration failed", err);
            if (err.response && err.response.data && err.response.data.detail) {
                setError(err.response.data.detail);
            } else {
                setError(t('auth.error_registration_generic'));
            }
        }
    };

    return (
        <div className="register-page">
            <Container>
                <Row className="justify-center w-full mx-0">
                    <Col className="mx-auto px-0 md:px-3" xs="12" sm="10" md="8" lg="12">
                        <Form onSubmit={handleRegister} className="form w-full">
                            <Card className="card-glass" style={{ width: '100%' }}>
                                <CardHeader className="text-center">
                                    <CardTitle tag="h3">{t('auth.register_title')}</CardTitle>
                                </CardHeader>
                                <CardBody>
                                    {error && <Alert color="danger">{error}</Alert>}
                                    <InputGroup className="input-tech">
                                        <InputGroupText>
                                            <FiMail size={20} />
                                        </InputGroupText>
                                        <Input
                                            placeholder={t('auth.email')}
                                            type="email"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            required
                                        />
                                    </InputGroup>
                                    <InputGroup className="mt-3 input-tech">
                                        <InputGroupText>
                                            <FiUser size={20} />
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
                                            <FiLock size={20} />
                                        </InputGroupText>
                                        <Input
                                            placeholder={t('auth.password')}
                                            type="password"
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
                                        {t('auth.register_button')}
                                    </Button>
                                    <div className="text-center">
                                        <Link to="/login" className="text-muted" style={{ color: '#aaa' }}>{t('auth.already_have_account')}</Link>
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

export default Register;
