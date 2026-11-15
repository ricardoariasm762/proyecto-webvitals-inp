import * as grpcWeb from 'grpc-web';
import { TelemetryFrame, OptimizationVerdict } from './vitals_telemetry_pb';

export class VitalsAuditorServiceClient {
  private client_: grpcWeb.GrpcWebClientBase;
  private hostname_: string;
  private credentials_: { [index: string]: any } | null;
  private options_: { [index: string]: any } | null;

  private static readonly methodDescriptor_EvaluateSingleFrame = new grpcWeb.MethodDescriptor<TelemetryFrame, OptimizationVerdict>(
    '/com.edu.vitals.grpc.VitalsAuditorService/EvaluateSingleFrame',
    grpcWeb.MethodType.UNARY,
    TelemetryFrame,
    OptimizationVerdict,
    (request: TelemetryFrame) => request.serializeBinary(),
    OptimizationVerdict.deserializeBinary
  );

  constructor(
    hostname: string,
    credentials?: { [index: string]: any } | null,
    options?: { [index: string]: any } | null
  ) {
    if (!options) {
      options = {};
    }
    options['format'] = options['format'] || 'binary';
    this.client_ = new grpcWeb.GrpcWebClientBase(options);
    this.hostname_ = hostname.replace(/\/+$/, '');
    this.credentials_ = credentials || null;
    this.options_ = options;
  }

  evaluateSingleFrame(
    request: TelemetryFrame,
    metadata?: grpcWeb.Metadata | null
  ): Promise<OptimizationVerdict>;
  evaluateSingleFrame(
    request: TelemetryFrame,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.RpcError, response: OptimizationVerdict) => void
  ): grpcWeb.ClientReadableStream<OptimizationVerdict>;
  evaluateSingleFrame(
    request: TelemetryFrame,
    metadata?: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.RpcError, response: OptimizationVerdict) => void
  ): Promise<OptimizationVerdict> | grpcWeb.ClientReadableStream<OptimizationVerdict> {
    const url = this.hostname_ + '/com.edu.vitals.grpc.VitalsAuditorService/EvaluateSingleFrame';

    if (callback) {
      return this.client_.rpcCall(
        url,
        request,
        metadata || {},
        VitalsAuditorServiceClient.methodDescriptor_EvaluateSingleFrame,
        callback
      );
    }

    return new Promise<OptimizationVerdict>((resolve, reject) => {
      this.client_.rpcCall(
        url,
        request,
        metadata || {},
        VitalsAuditorServiceClient.methodDescriptor_EvaluateSingleFrame,
        (err: grpcWeb.RpcError, response: OptimizationVerdict) => {
          if (err) {
            reject(err);
          } else {
            resolve(response);
          }
        }
      );
    });
  }
}
