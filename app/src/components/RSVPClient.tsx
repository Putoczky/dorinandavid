import { useEffect, useState } from 'react';
import QueryClientProvider from './QueryClientProvider';
import RSVPForm from './RSVPForm';

export default function RSVPClient() {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return (
			<div className="rsvp-loading-state p-6 sm:p-8 max-w-[800px] mx-auto text-center">
				<h2 className="font-cinzel text-2xl sm:text-4xl font-normal text-[#0a0a0a] mb-4">
					Jelezz vissza nekünk
				</h2>
				<p className="font-cinzel text-base sm:text-lg text-[#525252]">
					Betöltés...
				</p>
			</div>
		);
	}

	return (
		<QueryClientProvider>
			<RSVPForm />
		</QueryClientProvider>
	);
}

