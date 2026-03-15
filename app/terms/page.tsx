import { PageHeader } from '@/components/layout/page-header'

export default function TermsPage() {
  return (
    <>
      <PageHeader title="이용약관" showBack />
      <div className="py-6 space-y-6 text-sm text-foreground/80 leading-relaxed">
        <section>
          <h2 className="font-semibold text-foreground mb-2">제1조 (목적)</h2>
          <p className="text-muted-foreground">본 약관은 CoffeeZip(이하 "서비스")의 이용 조건 및 절차에 관한 사항을 규정합니다.</p>
        </section>

        <section>
          <h2 className="font-semibold text-foreground mb-2">제2조 (서비스 내용)</h2>
          <p className="text-muted-foreground">CoffeeZip은 브루잉 레시피 기록 및 공유 서비스를 제공합니다.</p>
        </section>

        <section>
          <h2 className="font-semibold text-foreground mb-2">제3조 (금지 행위)</h2>
          <ul className="space-y-1 list-disc list-inside text-muted-foreground">
            <li>타인의 정보를 도용하는 행위</li>
            <li>서비스를 이용하여 타인에게 해를 끼치는 행위</li>
            <li>서비스의 정상적인 운영을 방해하는 행위</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-foreground mb-2">제4조 (면책)</h2>
          <p className="text-muted-foreground">서비스는 사용자가 게시한 콘텐츠에 대해 책임지지 않으며, 서비스 중단으로 인한 손해에 대해 배상하지 않습니다.</p>
        </section>

        <p className="text-xs text-muted-foreground pt-4">최종 수정일: 2026-03-15</p>
      </div>
    </>
  )
}
