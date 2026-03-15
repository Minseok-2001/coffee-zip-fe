import { PageHeader } from '@/components/layout/page-header'

export default function PrivacyPage() {
  return (
    <>
      <PageHeader title="개인정보처리방침" showBack />
      <div className="py-6 space-y-6 text-sm text-foreground/80 leading-relaxed">
        <section>
          <h2 className="font-semibold text-foreground mb-2">1. 수집하는 개인정보</h2>
          <p>CoffeeZip은 Google 소셜 로그인을 통해 다음 정보를 수집합니다.</p>
          <ul className="mt-2 space-y-1 list-disc list-inside text-muted-foreground">
            <li>이메일 주소</li>
            <li>이름 (닉네임)</li>
            <li>프로필 사진 URL</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-foreground mb-2">2. 수집 목적</h2>
          <ul className="space-y-1 list-disc list-inside text-muted-foreground">
            <li>회원 식별 및 서비스 제공</li>
            <li>레시피 작성, 저장, 공유 기능</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-foreground mb-2">3. 보유 기간</h2>
          <p className="text-muted-foreground">회원 탈퇴 요청 시까지 보유하며, 탈퇴 후 즉시 삭제합니다.</p>
        </section>

        <section>
          <h2 className="font-semibold text-foreground mb-2">4. 제3자 제공</h2>
          <p className="text-muted-foreground">수집한 개인정보를 제3자에게 제공하지 않습니다.</p>
        </section>

        <section>
          <h2 className="font-semibold text-foreground mb-2">5. 문의</h2>
          <p className="text-muted-foreground">개인정보 관련 문의는 서비스 내 설정 페이지를 통해 연락해주세요.</p>
        </section>

        <p className="text-xs text-muted-foreground pt-4">최종 수정일: 2026-03-15</p>
      </div>
    </>
  )
}
