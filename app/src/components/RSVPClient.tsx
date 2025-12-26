import { useEffect, useState } from 'react';
import QueryClientProvider from './QueryClientProvider';
import RSVPForm from './RSVPForm';

export default function RSVPClient() {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return null;
	}

	return (
		<QueryClientProvider>
			<RSVPForm />
		</QueryClientProvider>
	);
}

