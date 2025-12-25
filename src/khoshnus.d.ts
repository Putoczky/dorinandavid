declare module 'khoshnus' {
	export interface FontInfo {
		name: string;
		strokeDashoffset: number;
	}

	export interface FONT_MATRIX {
		[key: string]: FontInfo;
	}

	export interface ManuscriptConfig {
		svgId?: string;
		font?: string;
		fontSize?: string;
	}

	export interface WriteConfiguration {
		eachLetterDelay?: number;
		delayOperation?: number;
	}

	export interface TextElementAttributes {
		x?: string;
		y?: string;
		textAnchor?: string;
		dominantBaseline?: string;
		fontSize?: string;
	}

	export interface WriteOptions {
		writeConfiguration?: WriteConfiguration;
		textElementAttributes?: TextElementAttributes;
	}

	export interface EraseOptions {
		delayOperation?: number;
	}

	export class Manuscript {
		constructor(config?: ManuscriptConfig);
		setup(config: {
			font?: string;
			fontSize?: string;
			start?: {
				startStrokeDashoffset?: number;
				startStroke?: string;
				startStrokeWidth?: number;
				startFill?: string;
			};
			end?: {
				endStrokeDashoffset?: number;
				endStroke?: string;
				endStrokeWidth?: number;
				endFill?: string;
			};
			durations?: {
				strokeDashoffsetDuration?: number;
				strokeWidthDuration?: number;
				strokeDuration?: number;
				fillDuration?: number;
			};
		}): void;
		write(text: string, options?: WriteOptions): string;
		erase(textId: string, options?: EraseOptions): void;
	}

	export const FONT_MATRIX: FONT_MATRIX;
}

