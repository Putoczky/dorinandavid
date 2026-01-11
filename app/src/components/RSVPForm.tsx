import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { Guest, VerifyNameResponse, RSVPRequest, RSVPResponse } from '../lib/api-client';
import { useVerifyName, useSubmitRSVP } from '../lib/api-client';

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
}

export default function RSVPForm() {
	const [step, setStep] = useState<'verify' | 'family-list' | 'rsvp'>('verify');
	const [familyMembers, setFamilyMembers] = useState<Guest[]>([]);
	const [rsvpData, setRsvpData] = useState<Record<string, RSVPFormData>>({});
	const [verifyErrorMessage, setVerifyErrorMessage] = useState<string>('');
	const [submitErrorMessage, setSubmitErrorMessage] = useState<string>('');

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
					result.familyMembers.forEach((member: Guest) => {
						initialRsvpData[member.id!] = {
							guestId: member.id!,
							attending: member.attending ?? true,
							email: member.email || '',
							phone: member.phone || '',
							dietaryRestrictions: member.dietaryRestrictions || '',
							notes: member.notes || '',
							szertartas: member.szertartas ?? false,
							lakodalom: member.lakodalom ?? false,
						};
					});

					setFamilyMembers(result.familyMembers);
					setRsvpData(initialRsvpData);
					setStep('family-list');
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
		// Submit RSVP for each family member
		const rsvpRequests: RSVPRequest[] = Object.values(rsvpData).map((data) => ({
			guestId: data.guestId,
			attending: data.attending,
			email: data.email || '',
			phone: data.phone || '',
			dietaryRestrictions: data.dietaryRestrictions || '',
			notes: data.notes || '',
			szertartas: data.szertartas ?? false,
			lakodalom: data.lakodalom ?? false,
		}));

		// Submit all RSVPs in parallel
		try {
			const results = await Promise.all(
				rsvpRequests.map((request) =>
					submitRSVPMutation.mutateAsync(request, {
						onError: async (error: Response) => {
							// Format error message from response
							try {
								const errorData = (await error.json()) as { error?: string };
								const errorMessage = errorData.error || `HTTP error! status: ${error.status}`;
								setSubmitErrorMessage(errorMessage);
							} catch {
								setSubmitErrorMessage(`HTTP error! status: ${error.status}`);
							}
						},
					})
				)
			);

			// Check if all succeeded
			const allSuccess = results.every((r: RSVPResponse) => r.success);
			if (!allSuccess) {
				setSubmitErrorMessage('Néhány RSVP küldése sikertelen volt');
				return;
			}

			// Reset form on success
			setStep('verify');
			setFamilyMembers([]);
			setRsvpData({});
			resetName();
			verifyNameMutation.reset();
		} catch (error) {
			// Error is already handled by onError callbacks
		}
	};

	if (step === 'family-list') {
		return (
			<div className="p-8 px-4 max-w-[800px] mx-auto relative z-[2]">
				<h2 className="font-['Style_Script'] text-3xl sm:text-4xl md:text-5xl font-normal text-[#0d0c16] mb-4 text-center">
					Családtagok
				</h2>
				<p className="font-['Style_Script'] text-lg sm:text-xl md:text-2xl font-normal text-[#0d0c16] mb-8 text-center leading-relaxed">
					A következő családtagokat találtuk:
				</p>

				<div className="flex flex-col gap-4 max-w-[500px] mx-auto mb-8">
					{familyMembers.map((member, index) => (
						<div
							key={member.id}
							className="border-b-2 border-[#0d0c16] pb-4 last:border-b-0"
						>
							<div className="flex items-center gap-3">
								<span className="font-['Style_Script'] text-xl sm:text-2xl text-[#0d0c16]">
									{index + 1}.
								</span>
								<div className="flex-1">
									<h3 className="font-['Style_Script'] text-xl sm:text-2xl md:text-3xl text-[#0d0c16]">
										{member.name}
										{member.surname && ` ${member.surname}`}
									</h3>
									{member.email && (
										<p className="font-['Style_Script'] text-base sm:text-lg text-gray-600 mt-1">
											{member.email}
										</p>
									)}
									{member.phone && (
										<p className="font-['Style_Script'] text-base sm:text-lg text-gray-600">
											{member.phone}
										</p>
									)}
									<div className="flex flex-col gap-2 mt-3">
										<label className="flex items-center gap-3 cursor-pointer">
											<input
												type="checkbox"
												checked={rsvpData[member.id!]?.szertartas ?? false}
												onChange={(e) =>
													updateRsvpData(member.id!, { szertartas: e.target.checked })
												}
												className="w-5 h-5 cursor-pointer"
											/>
											<span className="font-['Style_Script'] text-lg sm:text-xl text-[#0d0c16]">
												Szertartas
											</span>
										</label>
										<label className="flex items-center gap-3 cursor-pointer">
											<input
												type="checkbox"
												checked={rsvpData[member.id!]?.lakodalom ?? false}
												onChange={(e) =>
													updateRsvpData(member.id!, { lakodalom: e.target.checked })
												}
												className="w-5 h-5 cursor-pointer"
											/>
											<span className="font-['Style_Script'] text-lg sm:text-xl text-[#0d0c16]">
												Lakodalom
											</span>
										</label>
									</div>
								</div>
							</div>
						</div>
					))}
				</div>

				<div className="flex gap-4 justify-center">
					<button
						type="button"
						onClick={() => {
							setStep('verify');
							setFamilyMembers([]);
							setRsvpData({});
							resetName();
							verifyNameMutation.reset();
						}}
						className="bg-transparent border-2 border-[#5a6840] text-[#5a6840] py-3 px-8 font-['Style_Script'] text-lg sm:text-xl md:text-2xl cursor-pointer rounded transition-colors hover:bg-[#5a6840] hover:text-[#ffffff]"
					>
						Vissza
					</button>
					<button
						type="button"
						onClick={() => setStep('rsvp')}
						className="bg-[#5a6840] text-[#ffffff] border-0 py-3 px-8 font-['Style_Script'] text-lg sm:text-xl md:text-2xl cursor-pointer rounded transition-colors hover:bg-[#4a5634] active:bg-[#3a4528]"
					>
						Tovább az RSVP-hez
					</button>
				</div>
			</div>
		);
	}

	if (step === 'rsvp') {
		return (
			<div className="p-8 px-4 max-w-[800px] mx-auto relative z-[2]">
				<h2 className="font-['Style_Script'] text-3xl sm:text-4xl md:text-5xl font-normal text-[#0d0c16] mb-4 text-center">
					RSVP
				</h2>
				<p className="font-['Style_Script'] text-lg sm:text-xl md:text-2xl font-normal text-[#0d0c16] mb-8 text-center leading-relaxed">
					Kérjük, jelezd, hogy részt veszel az esküvőnkön
				</p>

				<div className="flex flex-col gap-8 max-w-[500px] mx-auto">
					{familyMembers.map((member) => (
						<div key={member.id} className="border-b-2 border-[#0d0c16] pb-6">
							<h3 className="font-['Style_Script'] text-2xl sm:text-3xl text-[#0d0c16] mb-4">
								{member.name}
							</h3>

							<div className="flex flex-col gap-4">
								<label className="flex items-center gap-3 cursor-pointer">
									<input
										type="checkbox"
										checked={rsvpData[member.id!]?.attending ?? true}
										onChange={(e) =>
											updateRsvpData(member.id!, { attending: e.target.checked })
										}
										className="w-5 h-5 cursor-pointer"
									/>
									<span className="font-['Style_Script'] text-lg sm:text-xl text-[#0d0c16]">
										Részt veszek
									</span>
								</label>

								{rsvpData[member.id!]?.attending && (
									<>
										<input
											type="email"
											placeholder="Email (opcionális)"
											value={rsvpData[member.id!]?.email || ''}
											onChange={(e) =>
												updateRsvpData(member.id!, { email: e.target.value })
											}
											className="bg-transparent border-0 border-b-2 border-[#0d0c16] py-3 font-['Style_Script'] text-lg sm:text-xl md:text-2xl text-[#0d0c16] outline-none w-full placeholder:text-gray-500 placeholder:opacity-70 focus:border-[#5a6840]"
										/>

										<input
											type="tel"
											placeholder="Telefon (opcionális)"
											value={rsvpData[member.id!]?.phone || ''}
											onChange={(e) =>
												updateRsvpData(member.id!, { phone: e.target.value })
											}
											className="bg-transparent border-0 border-b-2 border-[#0d0c16] py-3 font-['Style_Script'] text-lg sm:text-xl md:text-2xl text-[#0d0c16] outline-none w-full placeholder:text-gray-500 placeholder:opacity-70 focus:border-[#5a6840]"
										/>

										<textarea
											placeholder="Ételallergia vagy speciális igények (opcionális)"
											value={rsvpData[member.id!]?.dietaryRestrictions || ''}
											onChange={(e) =>
												updateRsvpData(member.id!, {
													dietaryRestrictions: e.target.value,
												})
											}
											rows={3}
											className="bg-transparent border-0 border-b-2 border-[#0d0c16] py-3 font-['Style_Script'] text-lg sm:text-xl md:text-2xl text-[#0d0c16] outline-none w-full placeholder:text-gray-500 placeholder:opacity-70 focus:border-[#5a6840] resize-none"
										/>
									</>
								)}
							</div>
						</div>
					))}

					{submitErrorMessage && (
						<div className="text-red-600 font-['Style_Script'] text-lg text-center">
							{submitErrorMessage}
						</div>
					)}

					<div className="flex gap-4 justify-center">
						<button
							type="button"
							onClick={() => {
								setStep('family-list');
								setSubmitErrorMessage('');
							}}
							className="bg-transparent border-2 border-[#5a6840] text-[#5a6840] py-3 px-8 font-['Style_Script'] text-lg sm:text-xl md:text-2xl cursor-pointer rounded transition-colors hover:bg-[#5a6840] hover:text-[#ffffff]"
						>
							Vissza
						</button>
						<button
							type="button"
							onClick={handleSubmitRSVP}
							disabled={submitRSVPMutation.isPending}
							className="bg-[#5a6840] text-[#ffffff] border-0 py-3 px-8 font-['Style_Script'] text-lg sm:text-xl md:text-2xl cursor-pointer rounded transition-colors hover:bg-[#4a5634] active:bg-[#3a4528] disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{submitRSVPMutation.isPending ? 'Küldés...' : 'Küldés'}
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="p-8 px-4 max-w-[800px] mx-auto relative z-[2]">
			<h2 className="font-['Style_Script'] text-3xl sm:text-4xl md:text-5xl font-normal text-[#0d0c16] mb-4 text-center">
				RSVP
			</h2>
			<p className="font-['Style_Script'] text-lg sm:text-xl md:text-2xl font-normal text-[#0d0c16] mb-8 text-center leading-relaxed">
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
					className="bg-transparent border-0 border-b-2 border-[#0d0c16] py-3 font-['Style_Script'] text-lg sm:text-xl md:text-2xl text-[#0d0c16] outline-none w-full placeholder:text-gray-500 placeholder:opacity-70 focus:border-[#5a6840]"
				/>
				{nameErrors.name && (
					<span className="text-red-600 font-['Style_Script'] text-lg -mt-6 text-center">
						{nameErrors.name.message}
					</span>
				)}

				{verifyErrorMessage && (
					<div className="text-red-600 font-['Style_Script'] text-lg text-center">
						{verifyErrorMessage}
					</div>
				)}

				<button
					type="submit"
					disabled={verifyNameMutation.isPending}
					className="bg-[#5a6840] text-[#ffffff] border-0 py-3 px-8 font-['Style_Script'] text-lg sm:text-xl md:text-2xl cursor-pointer rounded transition-colors self-center hover:bg-[#4a5634] active:bg-[#3a4528] disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{verifyNameMutation.isPending ? 'Keresés...' : 'Keresés'}
				</button>
			</form>
		</div>
	);
}
