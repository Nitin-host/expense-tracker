import React from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import '../styles/home.scss';

const svgSrc = "/svg/expense-tracker.svg";

export default function Home() {
    const user = useSelector((state) => state.auth.user);

    // Theme detection for SVG color filter (optional)
    const [theme, setTheme] = React.useState(
        document.body.classList.contains("dark-theme") ? "dark" : "light"
    );
    React.useEffect(() => {
        const obs = new MutationObserver(() =>
            setTheme(document.body.classList.contains("dark-theme") ? "dark" : "light")
        );
        obs.observe(document.body, { attributes: true, attributeFilter: ["class"] });
        return () => obs.disconnect();
    }, []);

    return (
        <div className="home-hero">
            <Container>
                <Row className="align-items-center g-4 flex-md-row flex-column-reverse">
                    {/* Right: Carded Content */}
                    <Col xs={12} md={6} className="d-flex justify-content-center justify-content-md-end">
                        <div className="home-info-card text-center text-md-start">
                            <h1 className="home-title">
                                {`Welcome${user && user.name ? `, ${user.name}` : ""} to Expense Tracker`}
                            </h1>
                            <p className="home-lead">
                                Effortlessly track expenses by creating custom <b>solution cards</b> – for festivals, trips, or anything you want.
                                Categorize each cost, select payment mode, and enjoy beautiful dashboards that reveal your spending trends and empower smarter budgeting, all in one place.
                            </p>
                            <Button
                                as={Link}
                                to="/solution"
                                size="lg"
                                variant="primary"
                                className="home-get-started-btn"
                                aria-label="Get Started with Expense Tracker"
                            >
                                Get Started
                            </Button>
                        </div>
                    </Col>
                    {/* Left: SVG Illustration, in a themed circle */}
                    <Col xs={12} md={6} className="d-flex justify-content-center align-items-center mb-4 mb-md-0">
                        <div className="home-svg-card">
                            <img
                                src={svgSrc}
                                alt="Expense Tracker Illustration"
                                className="home-svg"
                                style={
                                    theme === "dark"
                                        ? { filter: "invert(0.97) hue-rotate(182deg) brightness(0.93)" }
                                        : undefined
                                }
                            />
                        </div>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}
