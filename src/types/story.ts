// 스토리 노드 타입 정의
// 스토리 순서는 컴포넌트가 아니라 데이터(manifest)로만 제어된다. (명세 5장)

export type StoryNodeType =
  | "start"
  | "video"
  | "cutscene"
  | "puzzle"
  | "placeholder"
  | "ending";

export interface BaseStoryNode {
  id: string;
  type: StoryNodeType;
  chapter: number;
  order: number;
  /** 다음 노드 ID. 마지막 노드는 null. 컴포넌트는 파일명을 분석하지 않고 오직 nextId로만 이동한다. */
  nextId: string | null;
  enabled?: boolean;
}

export interface StartNode extends BaseStoryNode {
  type: "start";
  imageSrc: string;
}

export interface VideoNode extends BaseStoryNode {
  type: "video";
  videoSrc: string;
  allowSkip?: boolean;
}

export interface CutsceneNode extends BaseStoryNode {
  type: "cutscene";
  imageSrc: string;
  transition?: "fade" | "slowZoom" | "none";
  speaker?: string;
  caption?: string;
  /** 후속 단계에서 음성을 연결하기 위한 선택 필드 (명세 1.2) */
  audioSrc?: string;
}

export interface PuzzleNode extends BaseStoryNode {
  type: "puzzle";
  /** puzzleManifest의 퍼즐 정의 키를 가리킨다. */
  puzzleId: string;
}

export interface PlaceholderNode extends BaseStoryNode {
  type: "placeholder";
  label: string;
}

export interface EndingNode extends BaseStoryNode {
  type: "ending";
  imageSrc?: string;
  caption?: string;
}

export type StoryNode =
  | StartNode
  | VideoNode
  | CutsceneNode
  | PuzzleNode
  | PlaceholderNode
  | EndingNode;

// 진행 상태 저장 구조 (명세 15장)
export interface SavedProgress {
  currentNodeId: string;
  lastCutsceneNodeId: string | null;
  completedPuzzleIds: string[];
  puzzleAttempts: Record<string, number>;
  startedAt: string;
  updatedAt: string;
}
