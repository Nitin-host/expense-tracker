import React, { useContext } from 'react';
import { Container, Row, Col, Button } from '../components/ui';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { ThemeContext } from '../utils/ThemeContext';

const svgSrc = '/svg/expense-tracker.svg';

export default function Home() {
    const user = useSelector((state) => state.auth.user);
    const { theme } = useContext(ThemeContext);
    const firstName = user?.name?.split(' ')[0];
    const isDark = theme === 'dark';

    return (
        <div className="page-shell relative z-1 flex items-center justify-center px-4 py-10 md:px-4 md:pb-12 md:pt-10 max-md:px-1 max-md:pb-8 max-md:pt-5">
            <Container>
                <Row className="align-items-center g-4 flex-md-row flex-column-reverse">
                    <Col xs={12} md={6}>
                        <div
                            className={`mx-auto rounded-[1.35rem] border p-6 backdrop-blur-[10px] md:px-8 md:py-9 ${
                                isDark
                                    ? 'border-slate-400/15 bg-slate-900/70'
                                    : 'border-slate-900/5 bg-white/90'
                            }`}
                        >
                            <p
                                className={`mb-2.5 mt-0 text-[0.78rem] font-semibold uppercase tracking-[0.08em] ${
                                    isDark ? 'text-teal-300' : 'text-accent'
                                }`}
                            >
                                Expense Tracker
                            </p>
                            <h1 className="mb-4 font-sans text-[clamp(1.7rem,4.2vw,2.85rem)] font-extrabold leading-[1.12] tracking-[-0.03em]">
                                {firstName ? `Hi ${firstName},` : 'Welcome,'}
                                <span className="d-block">track spending with clarity.</span>
                            </h1>
                            <p
                                className={`mb-7 max-w-[34ch] text-[clamp(1rem,2vw,1.15rem)] font-normal leading-relaxed ${
                                    isDark ? 'text-slate-300' : 'text-muted'
                                }`}
                            >
                                Create solution cards for trips, events, or shared budgets — then
                                log expenses and watch the dashboard stay in balance.
                            </p>
                            <Button
                                as={Link}
                                to="/solution"
                                size="lg"
                                variant="primary"
                                className="min-h-12 rounded-[14px] px-6 py-[0.9rem] text-[1.02rem] font-semibold max-md:w-full"
                                aria-label="Open solutions"
                            >
                                Open Solutions
                            </Button>
                        </div>
                    </Col>
                    <Col xs={12} md={6}>
                        <div
                            className={`mx-auto flex min-h-[220px] items-center justify-center rounded-3xl border p-[1.1rem] md:min-h-[280px] md:p-6 ${
                                isDark
                                    ? 'border-slate-400/15 bg-[radial-gradient(circle_at_30%_20%,rgba(45,212,191,0.14),transparent_45%),rgba(15,23,42,0.55)]'
                                    : 'border-slate-900/5 bg-[radial-gradient(circle_at_30%_20%,rgba(20,184,166,0.16),transparent_45%),rgba(255,255,255,0.55)]'
                            }`}
                        >
                            <img
                                src={svgSrc}
                                alt=""
                                className="block max-h-[280px] max-w-[min(360px,88%)]"
                                style={
                                    isDark
                                        ? {
                                              filter:
                                                  'invert(0.97) hue-rotate(182deg) brightness(0.93)',
                                          }
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
