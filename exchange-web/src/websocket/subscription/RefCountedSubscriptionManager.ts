/**
 * 引用计数订阅：同一 topic 多处 acquire 只发一次 subscribe，最后一处 release 才 unsubscribe。
 */

export type WsSendFn = (msg: Record<string, unknown>) => void

export class RefCountedSubscriptionManager {
  private readonly counts = new Map<string, number>()
  private readonly send: WsSendFn

  constructor(send: WsSendFn) {
    this.send = send
  }

  /**
   * @param topicKey 逻辑键，仅用于去重，不发给服务端
   * @param subscribeMsg 首次引用计数 >0 时发送
   * @param unsubscribeMsg 引用计数归零时发送
   */
  acquire(topicKey: string, subscribeMsg: Record<string, unknown>, unsubscribeMsg: Record<string, unknown>): () => void {
    const n = (this.counts.get(topicKey) ?? 0) + 1
    this.counts.set(topicKey, n)
    if (n === 1) {
      this.send(subscribeMsg)
    }
    return () => this.release(topicKey, unsubscribeMsg)
  }

  private release(topicKey: string, unsubscribeMsg: Record<string, unknown>) {
    const n = (this.counts.get(topicKey) ?? 0) - 1
    if (n <= 0) {
      this.counts.delete(topicKey)
      this.send(unsubscribeMsg)
    } else {
      this.counts.set(topicKey, n)
    }
  }

  /** 页面卸载 / 切所时清空本地计数（不自动发 unsubscribe，需调用方先 stop 各 release） */
  reset() {
    this.counts.clear()
  }
}
