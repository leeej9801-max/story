// 진행 시퀀스 타입 정의 (지시서 v2 · 4장)
//
// 진행 순서는 컴포넌트가 아니라 데이터(sequenceManifest)로만 제어된다.
// 정지 이미지 컷신 구조(cutscene / imageSrc / slowZoom)는 v2에서 제거되었다.

export type SequenceStepType = "video" | "puzzle" | "gimmick" | "complete";

export interface BaseStep {
  id: string;
  type: SequenceStepType;
  /** 다음 단계 ID. complete 단계만 null. */
  nextStepId: string | null;
}

export interface VideoStep extends BaseStep {
  type: "video";
  title: string;
  src: string;
  /** 참가자는 어떤 방법으로도 영상을 건너뛸 수 없다. (지시서 5.1) */
  allowSkip: false;
  /**
   * 영상 파일이 아직 준비되지 않은 단계.
   * 파일을 public에 넣은 뒤 이 필드만 지우면 정상 재생된다.
   */
  pending?: boolean;
}

export interface PuzzleStep extends BaseStep {
  type: "puzzle";
  puzzleId: string;
}

export interface GimmickStep extends BaseStep {
  type: "gimmick";
  gimmickId: string;
}

export interface CompleteStep extends BaseStep {
  type: "complete";
  nextStepId: null;
}

export type SequenceStep = VideoStep | PuzzleStep | GimmickStep | CompleteStep;

// 진행 상태 저장 구조 (지시서 12장)
export interface SavedProgressV2 {
  currentStepId: string;
  videoCurrentTime: number;
  completedPuzzleIds: string[];
  puzzleAttempts: Record<string, number>;
  gimmickCompletedIds: string[];
  updatedAt: string;
}
