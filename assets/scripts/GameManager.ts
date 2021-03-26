import {
  _decorator,
  Component,
  Node,
  Prefab,
  instantiate,
  Vec3,
  systemEvent,
  SystemEventType,
  EventKeyboard,
  macro,
  RigidBody,
  director,
  v3,
} from "cc";
const { ccclass, property } = _decorator;

enum GameState {
  GS_INIT,
  GS_PLAYING,
  GS_END,
}

@ccclass("GameManager")
export class GameManager extends Component {
  @property(Node)
  private player: Node = null;
  private speed_x = 0.05;
  private moving_distance = 0;

  private trackLength = 2;
  private trackNodeWidth = 30;
  private trackStartX = this.trackNodeWidth / 2 - 2;
  private trackNodeArr: Node[] = [];
  private frontTrackIndex: number = 0;
  private lastBlockNode: Node = null;

  @property(Prefab)
  private blockPrefab: Prefab = null;

  private gameState: GameState = GameState.GS_INIT;
  private keyCode: number = -1;

  onLoad() {
    this.initTrack();

    systemEvent.on(SystemEventType.KEY_DOWN, this.onKeyDown, this);
    systemEvent.on(SystemEventType.KEY_UP, this.onKeyUp, this);
  }

  update() {
    if (this.gameState === GameState.GS_PLAYING) {
      const { x, y, z } = this.player.getPosition();
      this.player.setPosition(x + this.speed_x, y, z);

      this.moving_distance += this.speed_x;
      if (this.moving_distance >= this.trackNodeWidth) {
        this.switchTrack();
        this.moving_distance = 0;
      }
      if (this.keyCode === macro.KEY.q) {
        const rigidBody = this.player.getComponent(RigidBody);
        rigidBody.applyTorque(v3(200, 200, 200));
      }
    }
  }
  // 改变赛道坐标
  switchTrack() {
    const frontTrackNode = this.trackNodeArr[this.frontTrackIndex];
    const frontPos = frontTrackNode.getPosition();
    const lastPosX = this.lastBlockNode.getPosition().x;
    frontTrackNode.setPosition(
      new Vec3(lastPosX + this.trackNodeWidth, frontPos.y, frontPos.z)
    );

    this.lastBlockNode = frontTrackNode;
    this.frontTrackIndex =
      this.frontTrackIndex + 1 === this.trackLength
        ? 0
        : this.frontTrackIndex + 1;
    frontTrackNode.getRotation();
  }

  onKeyDown(event: EventKeyboard) {
    const keyCode = event.keyCode;
    if (keyCode === macro.KEY.w && this.gameState !== GameState.GS_PLAYING) {
      this.gameState = GameState.GS_PLAYING;
    } else if (
      keyCode === macro.KEY.s &&
      this.gameState === GameState.GS_PLAYING
    ) {
      this.gameState = GameState.GS_END;
    } else if (
      keyCode === macro.KEY.space &&
      this.gameState === GameState.GS_PLAYING
    ) {
      const rigidBody = this.player.getComponent(RigidBody);
      rigidBody.setLinearVelocity(new Vec3(0, 5, 0));
    }

    this.keyCode = keyCode;
  }

  onKeyUp() {
    this.keyCode = -1;
  }

  // 初始化赛道
  initTrack() {
    this.generateTrack();
    this.lastBlockNode = this.trackNodeArr[this.trackLength - 1];
  }

  // 生成赛道
  generateTrack() {
    for (let i = 0; i < this.trackLength; i++) {
      const blockNode = instantiate(this.blockPrefab);
      blockNode.setPosition(
        new Vec3(i * this.trackNodeWidth + this.trackStartX, -0.5, 0)
      );

      this.node.addChild(blockNode);
      this.trackNodeArr.push(blockNode);
    }
  }
}
