import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { Guest, VerifyNameResponse, RSVPRequest, RSVPResponse } from '../lib/api-client';
import { useVerifyName, useSubmitRSVP, submitRSVP } from '../lib/api-client';

interface NameFormData {
	name: string;
}

interface RSVPFormData {
	guestId: string;
	attending: boolean;
	email?: string;
	phone?: string;
	dietaryRestrictions?: string;
	notes?: string;
	szertartas?: boolean;
	lakodalom?: boolean;
	transfer?: boolean;
}

export default function RSVPForm() {
	const [step, setStep] = useState<'verify' | 'rsvp' | 'success'>('verify');
	const [familyMembers, setFamilyMembers] = useState<Guest[]>([]);
	const [rsvpData, setRsvpData] = useState<Record<string, RSVPFormData>>({});
	const [hasDietaryRestrictions, setHasDietaryRestrictions] = useState<Record<string, boolean>>({});
	const [familyEmail, setFamilyEmail] = useState<string>('');
	const [familyNotes, setFamilyNotes] = useState<string>('');
	const [familyId, setFamilyId] = useState<string>('');
	const [emailError, setEmailError] = useState<string>('');
	const [verifyErrorMessage, setVerifyErrorMessage] = useState<string>('');
	const [submitErrorMessage, setSubmitErrorMessage] = useState<string>('');
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

	const verifyNameMutation = useVerifyName();
	const submitRSVPMutation = useSubmitRSVP();

	const {
		register: registerName,
		handleSubmit: handleNameSubmit,
		formState: { errors: nameErrors },
		reset: resetName,
	} = useForm<NameFormData>();

	const handleVerifyName = async (data: NameFormData) => {
		setVerifyErrorMessage('');
		verifyNameMutation.mutate(
			{ name: data.name },
			{
				onSuccess: (result: VerifyNameResponse) => {
					if (!result.found) {
						verifyNameMutation.reset();
						return;
					}

					// Initialize RSVP data for each family member
					const initialRsvpData: Record<string, RSVPFormData> = {};
					const initialHasDietaryRestrictions: Record<string, boolean> = {};
					result.familyMembers.forEach((member: Guest) => {
						const hasExistingDietaryRestrictions = !!(member.dietaryRestrictions && member.dietaryRestrictions.trim());
						initialRsvpData[member.id!] = {
							guestId: member.id!,
							attending: true,
							email: '',
							phone: '',
							dietaryRestrictions: member.dietaryRestrictions || '',
							notes: '',
							szertartas: member.szertartas ?? false,
							lakodalom: member.lakodalom ?? false,
							transfer: member.transfer ?? false,
						};
						initialHasDietaryRestrictions[member.id!] = hasExistingDietaryRestrictions;
					});

					setFamilyMembers(result.familyMembers);
					setRsvpData(initialRsvpData);
					setHasDietaryRestrictions(initialHasDietaryRestrictions);
					setFamilyEmail(result.familyEmail || '');
					setFamilyNotes(result.familyNotes || '');
					setFamilyId(result.familyId || '');
					setStep('rsvp');
				},
				onError: async (error: Response) => {
					// Format error message from response
					try {
						const errorData = (await error.json()) as { error?: string };
						const errorMessage = errorData.error || `HTTP error! status: ${error.status}`;
						setVerifyErrorMessage(errorMessage);
					} catch {
						setVerifyErrorMessage(`HTTP error! status: ${error.status}`);
					}
				},
			}
		);
	};

	const updateRsvpData = (guestId: string, updates: Partial<RSVPFormData>) => {
		setRsvpData((prev) => ({
			...prev,
			[guestId]: {
				...prev[guestId],
				...updates,
			},
		}));
	};

	const handleSubmitRSVP = async () => {
		setSubmitErrorMessage('');
		setEmailError('');
		setIsSubmitting(true);
		
		try {
			// Validate email
			if (!familyEmail || !familyEmail.trim()) {
				setEmailError('Az email cím megadása kötelező');
				setIsSubmitting(false);
				return;
			}

			// Basic email validation
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(familyEmail.trim())) {
				setEmailError('Érvényes email cím szükséges');
				setIsSubmitting(false);
				return;
			}

			// Check if we have any RSVP data
			if (Object.keys(rsvpData).length === 0) {
				setSubmitErrorMessage('Nincs küldendő adat');
				setIsSubmitting(false);
				return;
			}

			// Submit RSVP for each family member
			const rsvpRequests: RSVPRequest[] = Object.values(rsvpData).map((data) => ({
				guestId: data.guestId,
				szertartas: data.szertartas ?? false,
				lakodalom: data.lakodalom ?? false,
				dietaryRestrictions: data.dietaryRestrictions || '',
				transfer: data.transfer ?? false,
				familyEmail: familyEmail.trim(),
				familyId: familyId || undefined,
				familyNotes: familyNotes.trim() || undefined,
			}));

			// Submit all RSVPs in parallel using Promise.allSettled to handle partial failures
			// Use the standalone submitRSVP function to avoid mutation state conflicts
			const results = await Promise.allSettled(
				rsvpRequests.map((request) => submitRSVP(request))
			);

			// Check results
			const successful: RSVPResponse[] = [];
			const failed: Array<{ error: Response; index: number }> = [];

			results.forEach((result, index) => {
				if (result.status === 'fulfilled') {
					successful.push(result.value);
				} else {
					// result.reason is the error (Response object)
					failed.push({ error: result.reason as Response, index });
				}
			});

			// If any failed, show error message
			if (failed.length > 0) {
				const firstError = failed[0].error;
				try {
					const errorData = (await firstError.json()) as { error?: string };
					const errorMessage = errorData.error || `HTTP error! status: ${firstError.status}`;
					setSubmitErrorMessage(errorMessage);
				} catch {
					setSubmitErrorMessage(`HTTP error! status: ${firstError.status}`);
				}
				return;
			}

			// Check if all succeeded
			const allSuccess = successful.every((r: RSVPResponse) => r.success);
			if (!allSuccess) {
				setSubmitErrorMessage('Néhány RSVP küldése sikertelen volt');
				return;
			}

			// Show success step
			setStep('success');
			setSubmitErrorMessage('');
		} catch (error) {
			console.error('Error submitting RSVP:', error);
			setSubmitErrorMessage('Hiba történt a küldés során');
		} finally {
			setIsSubmitting(false);
		}
	};

	if (step === 'rsvp') {
		return (
			<div className="p-8 px-4 pb-32 max-w-[800px] mx-auto relative z-[10]">
			<h2 className="font-optima text-3xl sm:text-4xl md:text-5xl font-normal text-[#0a0a0a] mb-4 text-center">
				Jelezz vissza nekünk
			</h2>
			<p className="font-optima text-lg sm:text-xl md:text-2xl font-normal text-[#0a0a0a] mb-8 text-center leading-relaxed">
			A következő vendégeknek a visszajelzését is el tudod küldeni:
			</p>

				<div className="flex flex-col gap-8 max-w-[800px] mx-auto">
					{familyMembers.map((member) => (
						<div key={member.id} className="border-b-2 border-[#0a0a0a] pb-6">
							<div className="flex items-center gap-8 mb-4">
								<span className="font-optima text-lg sm:text-xl text-[#0a0a0a] min-w-[200px]">
									{member.name}
									{member.surname && ` ${member.surname}`}
								</span>
								<div className="flex gap-8 flex-1">
									<label className="flex items-center gap-3 cursor-pointer">
										<input
											type="checkbox"
											checked={rsvpData[member.id!]?.szertartas ?? false}
											onChange={(e) =>
												updateRsvpData(member.id!, { szertartas: e.target.checked })
											}
											className="w-5 h-5 cursor-pointer"
										/>
										<span className="font-optima text-lg sm:text-xl text-[#0a0a0a]">
											Szertartas
										</span>
									</label>
									<label className="flex items-center gap-3 cursor-pointer">
										<input
											type="checkbox"
											checked={rsvpData[member.id!]?.lakodalom ?? false}
											onChange={(e) => {
												const checked = e.target.checked;
												updateRsvpData(member.id!, { lakodalom: checked });
												if (!checked) {
													// Clear dietary restrictions and transfer when lakodalom is unchecked
													updateRsvpData(member.id!, { dietaryRestrictions: '', transfer: false });
													setHasDietaryRestrictions((prev) => ({
														...prev,
														[member.id!]: false,
													}));
												}
											}}
											className="w-5 h-5 cursor-pointer"
										/>
										<span className="font-optima text-lg sm:text-xl text-[#0a0a0a]">
											Lakodalom
										</span>
									</label>
								</div>
							</div>
							{rsvpData[member.id!]?.lakodalom && (
								<>
									<div className="flex items-center gap-3">
										<label className="flex items-center gap-3 cursor-pointer">
											<input
												type="checkbox"
												checked={hasDietaryRestrictions[member.id!] || false}
												onChange={(e) => {
													const checked = e.target.checked;
													setHasDietaryRestrictions((prev) => ({
														...prev,
														[member.id!]: checked,
													}));
													if (!checked) {
														updateRsvpData(member.id!, { dietaryRestrictions: '' });
													}
												}}
												className="w-5 h-5 cursor-pointer"
											/>
											<span className="font-optima text-base sm:text-lg text-[#0a0a0a]">
												Etelerzekenyseg
											</span>
										</label>
										{hasDietaryRestrictions[member.id!] && (
											<input
												type="text"
												value={rsvpData[member.id!]?.dietaryRestrictions || ''}
												onChange={(e) =>
													updateRsvpData(member.id!, { dietaryRestrictions: e.target.value })
												}
												placeholder="Pl. laktózérzékenység, gluténmentes..."
												className="bg-transparent border-0 border-b-2 border-gray-400 py-2 font-optima text-base sm:text-lg text-[#0a0a0a] outline-none flex-1 placeholder:text-gray-500 placeholder:opacity-70 focus:border-gray-400"
											/>
										)}
									</div>
									<label className="flex items-center gap-3 cursor-pointer">
										<input
											type="checkbox"
											checked={rsvpData[member.id!]?.transfer ?? false}
											onChange={(e) =>
												updateRsvpData(member.id!, { transfer: e.target.checked })
											}
											className="w-5 h-5 cursor-pointer"
										/>
										<span className="font-optima text-base sm:text-lg text-[#0a0a0a]">
											Transfer
										</span>
									</label>
								</>
							)}
						</div>
					))}

					<div className="flex flex-col gap-2 mt-8">
						<label className="font-optima text-lg sm:text-xl text-[#0a0a0a]">
							Email cím <span className="text-red-600">*</span>
						</label>
						<p className="font-optima text-base sm:text-lg text-[#0a0a0a] opacity-80 mb-2">
							Ide kuldjuk el az eskuvon keszult kepeket illetve kisfilmeket.
						</p>
						<input
							type="email"
							value={familyEmail}
							onChange={(e) => {
								setFamilyEmail(e.target.value);
								setEmailError('');
							}}
							placeholder="email@example.com"
							className="bg-transparent border-0 border-b-2 border-[#0a0a0a] py-3 font-optima text-lg sm:text-xl md:text-2xl text-[#0a0a0a] outline-none w-full placeholder:text-gray-500 placeholder:opacity-70 focus:border-[#525252]"
						/>
						{emailError && (
							<span className="text-red-600 font-optima text-lg">
								{emailError}
							</span>
						)}
					</div>

					<div className="flex flex-col gap-2 mt-8">
						<label className="font-optima text-lg sm:text-xl text-[#0a0a0a]">
							Megjegyzes
						</label>
						<textarea
							value={familyNotes}
							onChange={(e) => setFamilyNotes(e.target.value)}
							placeholder="Opcionalis megjegyzes..."
							rows={4}
							className="bg-transparent border-0 border-b-2 border-[#0a0a0a] py-3 font-optima text-base sm:text-lg text-[#0a0a0a] outline-none w-full placeholder:text-gray-500 placeholder:opacity-70 focus:border-[#525252] resize-none"
						/>
					</div>

					{submitErrorMessage && (
						<div className="text-red-600 font-optima text-lg text-center">
							{submitErrorMessage}
						</div>
					)}

					<div className="flex gap-4 justify-center relative z-[11]">
						<button
							type="button"
							onClick={() => {
								setStep('verify');
								setFamilyMembers([]);
								setRsvpData({});
								setHasDietaryRestrictions({});
								setFamilyEmail('');
								setFamilyNotes('');
								setFamilyId('');
								setEmailError('');
								resetName();
								verifyNameMutation.reset();
								setSubmitErrorMessage('');
							}}
							className="bg-[#525252] border-2 border-[#525252] text-[#ffffff] py-3 px-8 font-optima text-lg sm:text-xl md:text-2xl cursor-pointer rounded transition-colors hover:bg-[#404040] hover:border-[#404040]"
						>
							Vissza
						</button>
						<button
							type="button"
							onClick={handleSubmitRSVP}
							disabled={isSubmitting}
							className="bg-[#525252] text-[#ffffff] border-0 py-3 px-8 font-optima text-lg sm:text-xl md:text-2xl cursor-pointer rounded transition-colors hover:bg-[#404040] active:bg-[#2a2a2a] disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isSubmitting ? 'Küldés...' : 'Elküldés'}
						</button>
					</div>
				</div>
			</div>
		);
	}

	if (step === 'success') {
		return (
			<div className="p-8 px-4 pb-32 max-w-[800px] mx-auto relative z-[10]">
				<h2 className="font-optima text-3xl sm:text-4xl md:text-5xl font-normal text-[#0a0a0a] mb-4 text-center">
					Jelezz vissza nekünk
				</h2>
				<div className="flex flex-col items-center gap-8 max-w-[500px] mx-auto mt-12">
					<p className="text-[#525252] font-optima text-xl sm:text-2xl md:text-3xl text-center">
						Valaszod elkuldve, koszonjuk a visszajelzest
					</p>
					<button
						type="button"
						onClick={() => {
							setStep('verify');
							setFamilyMembers([]);
							setRsvpData({});
							setHasDietaryRestrictions({});
							setFamilyEmail('');
							setFamilyNotes('');
							setFamilyId('');
							setEmailError('');
							setSubmitErrorMessage('');
							resetName();
							verifyNameMutation.reset();
						}}
						className="bg-[#525252] text-[#ffffff] border-0 py-3 px-8 font-optima text-lg sm:text-xl md:text-2xl cursor-pointer rounded transition-colors hover:bg-[#404040] active:bg-[#2a2a2a]"
					>
						Uj visszajelzes
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="p-8 px-4 pb-32 max-w-[800px] mx-auto relative z-[10]">
			<h2 className="font-optima text-3xl sm:text-4xl md:text-5xl font-normal text-[#0a0a0a] mb-4 text-center">
				Jelezz vissza nekünk
			</h2>
			<p className="font-optima text-lg sm:text-xl md:text-2xl font-normal text-[#0a0a0a] mb-8 text-center leading-relaxed">
				Kérjük, add meg a neved, hogy megtaláljuk a vendéglistán
			</p>
			<form
				className="flex flex-col gap-6 max-w-[500px] mx-auto"
				onSubmit={handleNameSubmit(handleVerifyName)}
			>
				<input
					type="text"
					{...registerName('name', { required: 'A név megadása kötelező' })}
					placeholder="Név"
					className="bg-transparent border-0 border-b-2 border-[#0a0a0a] py-3 font-optima text-lg sm:text-xl md:text-2xl text-[#0a0a0a] outline-none w-full placeholder:text-gray-500 placeholder:opacity-70 focus:border-[#525252]"
				/>
				{nameErrors.name && (
					<span className="text-red-600 font-optima text-lg -mt-6 text-center">
						{nameErrors.name.message}
					</span>
				)}

				{verifyErrorMessage && (
					<div className="text-red-600 font-optima text-lg text-center">
						{verifyErrorMessage}
					</div>
				)}

				<button
					type="submit"
					disabled={verifyNameMutation.isPending}
					className="bg-[#0a0a0a] text-[#ffffff] border-0 py-3 px-8 font-optima text-lg sm:text-xl md:text-2xl cursor-pointer rounded transition-colors self-center hover:bg-[#2a2a2a] active:bg-[#404040] disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{verifyNameMutation.isPending ? 'Keresés...' : 'Tovább'}
				</button>
			</form>
		</div>
	);
}
