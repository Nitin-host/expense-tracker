import React, { useContext } from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { ThemeContext } from "../utils/ThemeContext";  // import your ThemeContext
import '../styles/home.scss';

const svgSrc = "/svg/expense-tracker.svg";

export default function Home() {
    const user = useSelector((state) => state.auth.user);
    const { theme } = useContext(ThemeContext);  // get theme from context

    return (
        <div className="home-hero">
            <Container>
                <Row className="align-items-center g-4 flex-md-row flex-column-reverse">
                    {/* Right: Carded Content */}
                    <Col xs={12} md={6}>
                        <div className={`home-info-card ${theme === "dark" ? "dark" : ""}`}>
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
                    <Col xs={12} md={6}>
                        <div className={`home-svg-card ${theme === "dark" ? "dark" : ""}`}>
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
