import { Link } from 'react-router';

export function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-2xl font-semibold text-text">Page Not Found</h1>
      <p className="mt-2 text-[15px] text-text-secondary">
        The page you're looking for doesn't exist.
      </p>
      <Link
        to="/"
        className="mt-6 inline-block text-[14px] font-medium text-accent hover:text-accent-hover"
      >
        Back to Home
      </Link>
    </div>
  );
}
