/** 下单与表单校验（业务实现仍在 composables，此处统一入口） */
export { validateSpotOrderForm, parseSpotOrderNum, buildSpotPlaceOrderPayload } from '@/composables/spot/validateSpotOrderForm'
export {
  validateFuturesOrderForm,
  buildFuturesPlaceOrderPayload,
  tryBuildFuturesPlaceOrderPayload,
} from '@/composables/futures/validateFuturesOrderForm'
