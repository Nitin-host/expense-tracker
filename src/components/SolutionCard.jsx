import React from 'react';
import { Link } from 'react-router-dom';
import { FaEdit, FaTrashAlt, FaArrowRight } from 'react-icons/fa';
import { GoShareAndroid } from 'react-icons/go';

export default function SolutionCard({ solution, onEdit, onDelete, onShare }) {
    return (
        <article className="solution-card">
            <div className="solution-card__accent" aria-hidden />

            <header className="solution-card__header">
                <div className="solution-card__title-wrap">
                    <h3 className="solution-card__title">{solution.name}</h3>
                    <span className="year-chip">{solution.year}</span>
                </div>
                <button
                    type="button"
                    className="solution-card__share"
                    onClick={() => onShare(solution)}
                    title="Share"
                    aria-label={`Share ${solution.name}`}
                >
                    <GoShareAndroid />
                </button>
            </header>

            <p className="solution-card__desc">
                {solution.description || 'No description yet.'}
            </p>

            <div className="solution-card__actions">
                <button type="button" className="solution-card__btn solution-card__btn--edit" onClick={() => onEdit(solution)}>
                    <FaEdit aria-hidden /> Edit
                </button>
                <button type="button" className="solution-card__btn solution-card__btn--delete" onClick={() => onDelete(solution)}>
                    <FaTrashAlt aria-hidden /> Delete
                </button>
            </div>

            <footer className="solution-card__footer">
                <Link className="solution-card__explore" to={`/solution/${solution._id}/dashboard`}>
                    Explore
                    <FaArrowRight aria-hidden />
                </Link>
            </footer>
        </article>
    );
}
