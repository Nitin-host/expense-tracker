import React from 'react';
import RouteErrorFallback from './RouteErrorFallback';

export default class AppErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        console.error('[AppErrorBoundary]', error, info?.componentStack);
    }

    handleRetry = () => {
        this.setState({ error: null });
        window.location.reload();
    };

    render() {
        if (this.state.error) {
            return (
                <RouteErrorFallback
                    title="App failed to load"
                    message="A part of the app could not be loaded. Reload to fetch the latest version."
                    onRetry={this.handleRetry}
                />
            );
        }
        return this.props.children;
    }
}
