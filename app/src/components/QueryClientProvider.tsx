import { QueryClient, QueryClientProvider as RQQueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useState } from 'react';

interface QueryClientProviderProps {
	children: ReactNode;
}

export default function QueryClientProvider({ children }: QueryClientProviderProps) {
	// Create QueryClient only on the client side using useState
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 1000 * 60 * 5, // 5 minutes
						refetchOnWindowFocus: false,
					},
				},
			})
	);

	return <RQQueryClientProvider client={queryClient}>{children}</RQQueryClientProvider>;
}

