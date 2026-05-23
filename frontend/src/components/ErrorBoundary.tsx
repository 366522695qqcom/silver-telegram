import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold text-apple-text mb-4">页面加载失败</h1>
          <p className="text-apple-text-secondary mb-8">请刷新页面重试</p>
          <button onClick={() => window.location.reload()} className="px-6 py-3 bg-apple-blue text-white rounded-apple-lg hover:bg-apple-blue-hover transition-colors">
            刷新页面
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}