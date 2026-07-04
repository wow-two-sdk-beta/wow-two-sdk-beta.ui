/** Defines the success envelope every wow-two API wraps its payload in: `{ data: T }`. */
export interface ApiResponse<T> {
  data: T;
}
