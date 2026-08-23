import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaTimes } from 'react-icons/fa';

const ModalContext = createContext({ onHide: null });

const cn = (...parts) => parts.filter(Boolean).join(' ');

const BTN_VARIANTS = {
    primary:
        'bg-accent text-white border border-accent hover:bg-accent-hover hover:border-accent-hover disabled:opacity-60',
    secondary:
        'bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600 dark:hover:bg-slate-700 disabled:opacity-60',
    'outline-primary':
        'bg-transparent text-accent border border-accent/40 hover:bg-accent/10 dark:text-teal-300 dark:border-teal-400/35 dark:hover:bg-teal-400/10 disabled:opacity-60',
    'outline-secondary':
        'bg-transparent text-slate-600 border border-slate-300 hover:bg-slate-100 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-800 disabled:opacity-60',
    danger:
        'bg-red-600 text-white border border-red-600 hover:bg-red-700 disabled:opacity-60',
    link: 'bg-transparent border-0 text-accent hover:underline p-0 shadow-none dark:text-teal-300',
};

const BTN_SIZES = {
    sm: 'min-h-9 px-3 py-1.5 text-sm',
    lg: 'min-h-12 px-5 py-2.5 text-base',
    default: 'min-h-10 px-4 py-2 text-sm',
};

export function Button({
    as: Component = 'button',
    variant = 'primary',
    size,
    className = '',
    type = 'button',
    disabled,
    children,
    ...props
}) {
    const classNames = cn(
        'inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold transition-colors active:scale-[0.98] disabled:pointer-events-none no-underline',
        BTN_VARIANTS[variant] || BTN_VARIANTS.primary,
        BTN_SIZES[size] || BTN_SIZES.default,
        className
    );

    if (Component !== 'button') {
        return (
            <Component className={classNames} {...props}>
                {children}
            </Component>
        );
    }

    return (
        <button type={type} disabled={disabled} className={classNames} {...props}>
            {children}
        </button>
    );
}

function ModalHeader({ closeButton, onHide, children, className = '' }) {
    const ctx = useContext(ModalContext);
    const handleClose = onHide || ctx.onHide;
    return (
        <div className={cn('et-modal-header', className)}>
            <div className="et-modal-header__title">{children}</div>
            {closeButton && handleClose ? (
                <button
                    type="button"
                    onClick={handleClose}
                    className="et-modal-close"
                    aria-label="Close"
                >
                    <FaTimes />
                </button>
            ) : null}
        </div>
    );
}

function ModalTitle({ children, className = '' }) {
    return <h2 className={cn('et-modal-title', className)}>{children}</h2>;
}

function ModalBody({ children, className = '' }) {
    return <div className={cn('et-modal-body', className)}>{children}</div>;
}

function ModalFooter({ children, className = '' }) {
    return <div className={cn('et-modal-footer', className)}>{children}</div>;
}

const MODAL_SIZES = {
    sm: 'et-modal-dialog--sm',
    md: 'et-modal-dialog--md',
    lg: 'et-modal-dialog--lg',
    xl: 'et-modal-dialog--xl',
};

export function Modal({
    show,
    onHide,
    centered = true,
    backdrop = true,
    keyboard = true,
    size,
    fullscreen,
    children,
    className = '',
}) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!show) return undefined;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [show]);

    useEffect(() => {
        if (!show || !keyboard || !onHide) return undefined;
        const onKey = (e) => {
            if (e.key === 'Escape') onHide();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [show, keyboard, onHide]);

    if (!show || !mounted) return null;

    const staticBackdrop = backdrop === 'static';
    const dialogClass = cn(
        'et-modal-dialog',
        MODAL_SIZES[size] || MODAL_SIZES.md,
        fullscreen === 'sm-down' && 'et-modal-dialog--fullscreen-sm',
        className
    );

    return createPortal(
        <div className="et-modal-root" role="dialog" aria-modal="true">
            <div
                className="et-modal-backdrop"
                onClick={staticBackdrop ? undefined : onHide}
                aria-hidden
            />
            <div className={cn('et-modal-shell', centered && 'et-modal-shell--centered')}>
                <div className={dialogClass}>
                    <div className="et-modal-content">
                        <ModalContext.Provider value={{ onHide }}>{children}</ModalContext.Provider>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

Modal.Header = ModalHeader;
Modal.Title = ModalTitle;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;

const ALERT_VARIANTS = {
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200',
    danger: 'border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-200',
    warning: 'border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200',
    info: 'border-sky-500/30 bg-sky-500/10 text-sky-900 dark:text-sky-200',
    light: 'border-[var(--et-border)] bg-[var(--surface)] text-[var(--table-text)]',
};

export function Alert({ variant = 'info', dismissible, onClose, className = '', children, style }) {
    return (
        <div
            className={cn(
                'relative rounded-[12px] border px-4 py-3 text-sm',
                ALERT_VARIANTS[variant] || ALERT_VARIANTS.info,
                className
            )}
            style={style}
            role="alert"
        >
            {dismissible && onClose ? (
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-md opacity-70 hover:opacity-100"
                    aria-label="Close"
                >
                    <FaTimes size={12} />
                </button>
            ) : null}
            {children}
        </div>
    );
}

export function Spinner({ size, className = '' }) {
    const dim = size === 'sm' ? 'h-4 w-4 border-2' : 'h-5 w-5 border-2';
    return (
        <span
            className={cn('inline-block animate-spin rounded-full border-current border-r-transparent', dim, className)}
            role="status"
            aria-hidden
        />
    );
}

function FormGroup({
    as,
    className = '',
    controlId,
    children,
    xs,
    sm,
    md,
    lg,
    xl,
    ...props
}) {
    const groupClass = cn('et-form-group', className);

    if (as === Col) {
        return (
            <Col xs={xs} sm={sm} md={md} lg={lg} xl={xl} className={groupClass} id={controlId} {...props}>
                {children}
            </Col>
        );
    }

    const Tag = as || 'div';
    return (
        <Tag className={groupClass} id={controlId} {...props}>
            {children}
        </Tag>
    );
}

function FormLabel({ className = '', children, htmlFor }) {
    return (
        <label htmlFor={htmlFor} className={cn('mb-1.5 block text-sm font-semibold text-[var(--table-text)]', className)}>
            {children}
        </label>
    );
}

function FormControl({ as, className = '', rows, isInvalid, ...props }) {
    const base =
        'w-full rounded-[10px] border px-3 py-2.5 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 dark:focus:border-teal-400 dark:focus:ring-teal-400/20';
    const themeFields =
        'border-[var(--form-border-color)] bg-[var(--form-bg)] text-[var(--form-text-color)] placeholder:text-[var(--form-placeholder-color)]';
    const invalid = isInvalid ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : '';
    if (as === 'textarea') {
        return <textarea rows={rows || 3} className={cn(base, themeFields, invalid, 'resize-y', className)} {...props} />;
    }
    return <input className={cn(base, themeFields, invalid, className)} {...props} />;
}

function FormSelect({ size, className = '', children, ...props }) {
    return (
        <select
            className={cn(
                'w-full rounded-[10px] border border-[var(--form-border-color)] bg-[var(--form-bg)] px-3 py-2.5 text-sm text-[var(--form-text-color)] outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20',
                size === 'sm' && 'et-form-select--sm',
                className
            )}
            {...props}
        >
            {children}
        </select>
    );
}

function FormCheck({ type = 'checkbox', label, id, className = '', ...props }) {
    const autoId = React.useId();
    const inputId = id || autoId;
    return (
        <div className={cn('et-form-check', className)}>
            <input type={type} id={inputId} className="et-form-check-input" {...props} />
            {label ? (
                <label htmlFor={inputId} className="et-form-check-label">
                    {label}
                </label>
            ) : null}
        </div>
    );
}

function FormRoot({ className = '', onSubmit, children }) {
    return (
        <form className={className} onSubmit={onSubmit} noValidate>
            {children}
        </form>
    );
}

export const Form = Object.assign(FormRoot, {
    Group: FormGroup,
    Label: FormLabel,
    Control: FormControl,
    Select: FormSelect,
    Check: FormCheck,
});

export function FormControlAlias(props) {
    return <FormControl {...props} />;
}

export function InputGroup({ className = '', children }) {
    return (
        <div className={cn('flex w-full items-stretch [&>input]:rounded-r-none [&>input+*]:rounded-l-none [&>input+*]:border-l-0', className)}>
            {children}
        </div>
    );
}

export function CloseButton({ onClick, className = '' }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800',
                className
            )}
            aria-label="Close"
        >
            <FaTimes />
        </button>
    );
}

export function Table({ striped, bordered, hover, responsive, className = '', children }) {
    const table = (
        <table
            className={cn(
                'w-full border-collapse text-sm',
                striped && 'table-striped',
                bordered && 'table-bordered',
                hover && 'table-hover',
                className
            )}
        >
            {children}
        </table>
    );
    if (responsive) {
        return <div className="w-full overflow-x-auto">{table}</div>;
    }
    return table;
}

function PaginationItem({ active, disabled, onClick, children, className = '' }) {
    return (
        <li>
            <button
                type="button"
                disabled={disabled}
                onClick={disabled ? undefined : onClick}
                className={cn(
                    'inline-flex min-h-9 min-w-9 items-center justify-center rounded-[8px] border px-2 text-sm font-medium transition',
                    active
                        ? 'border-accent bg-accent text-white'
                        : 'border-[var(--et-border)] bg-[var(--surface)] text-[var(--table-text)] hover:bg-accent/10 disabled:opacity-45',
                    className
                )}
            >
                {children}
            </button>
        </li>
    );
}

function PaginationNav({ className = '', children }) {
    return <ul className={cn('flex list-none flex-wrap items-center gap-1 p-0', className)}>{children}</ul>;
}

export function Pagination({ className = '', children }) {
    return <PaginationNav className={className}>{children}</PaginationNav>;
}

Pagination.First = ({ disabled, onClick }) => (
    <PaginationItem disabled={disabled} onClick={onClick}>
        «
    </PaginationItem>
);
Pagination.Prev = ({ disabled, onClick }) => (
    <PaginationItem disabled={disabled} onClick={onClick}>
        ‹
    </PaginationItem>
);
Pagination.Next = ({ disabled, onClick }) => (
    <PaginationItem disabled={disabled} onClick={onClick}>
        ›
    </PaginationItem>
);
Pagination.Last = ({ disabled, onClick }) => (
    <PaginationItem disabled={disabled} onClick={onClick}>
        »
    </PaginationItem>
);
Pagination.Item = PaginationItem;
Pagination.Ellipsis = () => (
    <li className="inline-flex min-h-9 min-w-9 items-center justify-center px-1 text-[var(--et-muted)]">…</li>
);

export function Container({ fluid, className = '', children }) {
    return (
        <div className={cn(fluid ? 'w-full px-3' : 'mx-auto w-full max-w-[1320px] px-3', className)}>
            {children}
        </div>
    );
}

export function Row({ className = '', children }) {
    return <div className={cn('et-row', className)}>{children}</div>;
}

const COL_WIDTH = {
    12: 'w-full',
    6: 'w-1/2',
    4: 'w-1/3',
    3: 'w-1/4',
};

function colSpanClass(breakpoint, span) {
    if (span == null) return '';
    if (span === 'auto') {
        if (breakpoint === 'xs') return 'w-auto flex-none';
        return `${breakpoint}:w-auto ${breakpoint}:flex-none`;
    }
    const width = COL_WIDTH[span];
    if (!width) return '';
    if (breakpoint === 'xs') return width;
    return `${breakpoint}:${width}`;
}

export function Col({ xs, sm, md, lg, xl, className = '', children }) {
    const widthClasses = [
        colSpanClass('xs', xs ?? 12),
        sm != null ? colSpanClass('sm', sm) : '',
        md != null ? colSpanClass('md', md) : '',
        lg != null ? colSpanClass('lg', lg) : '',
        xl != null ? colSpanClass('xl', xl) : '',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={cn('et-col min-w-0', widthClasses, className)}>
            {children}
        </div>
    );
}

function BreadcrumbItem({ active, linkAs: LinkComponent, linkProps, children, title }) {
    if (active || !LinkComponent) {
        return (
            <li
                className={cn('app-breadcrumbs__item', active && 'app-breadcrumbs__item--active')}
                aria-current={active ? 'page' : undefined}
                title={title}
            >
                {children}
            </li>
        );
    }
    return (
        <li className="app-breadcrumbs__item">
            <LinkComponent {...linkProps} className="app-breadcrumbs__link" title={title}>
                {children}
            </LinkComponent>
        </li>
    );
}

export function Breadcrumb({ className = '', children }) {
    return (
        <nav aria-label="breadcrumb" className={cn('app-breadcrumbs', className)}>
            <ol className="app-breadcrumbs__list">
                {React.Children.map(children, (child, i) =>
                    React.isValidElement(child) ? (
                        <React.Fragment key={i}>
                            {i > 0 ? (
                                <li className="app-breadcrumbs__sep" aria-hidden>
                                    /
                                </li>
                            ) : null}
                            {child}
                        </React.Fragment>
                    ) : null
                )}
            </ol>
        </nav>
    );
}

Breadcrumb.Item = BreadcrumbItem;

export function Popover({ id, className = '', children }) {
    return (
        <div
            id={id}
            className={cn(
                'min-w-[260px] overflow-hidden rounded-[12px] border border-[var(--et-border)] bg-[var(--surface)] shadow-lg',
                className
            )}
        >
            {children}
        </div>
    );
}

function PopoverHeader({ as: Tag = 'div', className = '', children }) {
    return (
        <Tag className={cn('border-b border-[var(--et-border)] px-3 py-2.5 text-sm font-bold', className)}>
            {children}
        </Tag>
    );
}

function PopoverBody({ className = '', children }) {
    return <div className={cn('px-3 py-2.5', className)}>{children}</div>;
}

Popover.Header = PopoverHeader;
Popover.Body = PopoverBody;

export function OverlayTrigger({ trigger = 'click', rootClose, placement = 'bottom-start', overlay, children }) {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);

    useEffect(() => {
        if (!open || !rootClose) return undefined;
        const onDoc = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, [open, rootClose]);

    const child = React.Children.only(children);
    const toggle = () => setOpen((v) => !v);

    const placementClass =
        placement === 'bottom-start'
            ? 'left-0 top-[calc(100%+0.35rem)]'
            : 'right-0 top-[calc(100%+0.35rem)]';

    return (
        <div className="relative inline-flex" ref={wrapRef}>
            {React.cloneElement(child, {
                onClick: trigger === 'click' ? toggle : child.props.onClick,
            })}
            {open ? <div className={cn('absolute z-[1040]', placementClass)}>{overlay}</div> : null}
        </div>
    );
}

export function Navbar({ fixed, expand, className = '', children }) {
    void fixed;
    void expand;
    return <header className={cn('app-navbar w-full', className)}>{children}</header>;
}

function NavbarBrand({ as: Component = 'div', className = '', children, ...props }) {
    return (
        <Component className={cn('brand-mark text-lg font-bold no-underline', className)} {...props}>
            {children}
        </Component>
    );
}

function NavbarText({ className = '', children }) {
    return <span className={className}>{children}</span>;
}

Navbar.Brand = NavbarBrand;
Navbar.Text = NavbarText;

export function Nav({ className = '', children }) {
    return <nav className={className}>{children}</nav>;
}

function NavLink({ as: Component = 'a', className = '', children, ...props }) {
    return (
        <Component className={cn('text-sm font-semibold text-accent no-underline hover:underline dark:text-teal-300', className)} {...props}>
            {children}
        </Component>
    );
}

Nav.Link = NavLink;

export { FormControl };
