import { QueryClient, QueryClientProvider as RQQueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Create a client instance
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5, // 5 minutes
			refetchOnWindowFocus: false,
		},
	},
});

interface QueryClientProviderProps {
	children: ReactNode;
}

export default function QueryClientProvider({ children }: QueryClientProviderProps) {
	return <RQQueryClientProvider client={queryClient}>{children}</RQQueryClientProvider>;
}

