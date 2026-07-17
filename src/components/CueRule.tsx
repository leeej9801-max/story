interface CueRuleProps {
  /** 줄바꿈(\n)이 그대로 표시된다. */
  text: string;
}

/** 색을 입힐 낱말 → 클래스 */
const TINTED: Record<string, string> = {
  빨간: "cue-rule-red",
  파란: "cue-rule-blue",
};

// 정규식 자체에서 분리해 두 곳(큐시트/확대 모달)이 같은 규칙을 쓰게 한다.
const SPLIT = new RegExp(`(${Object.keys(TINTED).join("|")})`, "g");

// 큐시트 오른쪽 위 규칙 문구.
//
// 빨강·파랑 문을 교차하라는 규칙이라 낱말이 가리키는 색을 글자에 그대로 입힌다.
// 큐시트가 세피아 단색이므로 채도를 낮춰 양피지 위 잉크처럼 보이게 한다.
export function CueRule({ text }: CueRuleProps) {
  return (
    <span className="cue-rule">
      {text.split(SPLIT).map((part, i) => {
        const tint = TINTED[part];
        return tint ? (
          <span key={i} className={tint}>
            {part}
          </span>
        ) : (
          part
        );
      })}
    </span>
  );
}
