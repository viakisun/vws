// 한국 이름 처리 유틸리티

/**
 * 한국 이름인지 확인하는 함수
 * @param name 이름 문자열
 * @returns 한국 이름 여부
 */
export function isKoreanName(name: string): boolean {
	if (!name || typeof name !== 'string') return false;
	
	// 한글 정규식 (가-힣)
	const koreanRegex = /^[가-힣\s]+$/;
	return koreanRegex.test(name.trim());
}

/**
 * 한국 이름을 성+이름(띄어쓰기 없이) 형태로 변환
 * @param firstName 성
 * @param lastName 이름
 * @returns 가공된 한국 이름 또는 원본 이름
 */
export function formatKoreanName(firstName: string, lastName: string): string {
	if (!firstName || !lastName) return '';
	
	const fullName = `${firstName} ${lastName}`.trim();
	
	// 한국 이름인 경우에만 성+이름 형태로 변환
	if (isKoreanName(fullName)) {
		return `${firstName}${lastName}`;
	}
	
	// 한국 이름이 아닌 경우 원본 형태 유지
	return fullName;
}

/**
 * 전체 이름에서 한국 이름 부분만 가공
 * @param fullName 전체 이름 (예: "박 기선" 또는 "기선 박")
 * @returns 가공된 이름 (예: "박기선")
 */
export function processKoreanName(fullName: string): string {
	if (!fullName || typeof fullName !== 'string') return '';
	
	const trimmed = fullName.trim();
	
	// 한국 이름인 경우
	if (isKoreanName(trimmed)) {
		// 공백으로 분리
		const parts = trimmed.split(/\s+/);
		if (parts.length >= 2) {
			// 이미 성이 앞에 있는 경우 (예: "박 기선")
			// 또는 이름이 앞에 있는 경우 (예: "기선 박") 모두 처리
			const [first, second] = parts;
			
			// 성이 1글자이고 이름이 2글자 이상인 경우가 일반적
			// 하지만 데이터베이스에서 이미 "성 이름" 순서로 오므로 그대로 처리
			return `${first}${second}`;
		}
	}
	
	// 한국 이름이 아니거나 공백이 없는 경우 원본 반환
	return trimmed;
}
