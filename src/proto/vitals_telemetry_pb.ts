import * as jspb from 'google-protobuf';

export class TelemetryFrame extends jspb.Message {
  constructor(...args: unknown[]) {
    super();
    const opt_data = args[0] as jspb.Message.MessageArray | undefined;
    jspb.Message.initialize(this, opt_data || [], 0, -1, [], null);
  }

  getSessionId(): string {
    return jspb.Message.getFieldWithDefault(this, 1, '');
  }

  setSessionId(value: string): TelemetryFrame {
    jspb.Message.setField(this, 1, value);
    return this;
  }

  getUrlPath(): string {
    return jspb.Message.getFieldWithDefault(this, 2, '');
  }

  setUrlPath(value: string): TelemetryFrame {
    jspb.Message.setField(this, 2, value);
    return this;
  }

  getLongTaskDurationMs(): number {
    return jspb.Message.getFieldWithDefault(this, 3, 0.0);
  }

  setLongTaskDurationMs(value: number): TelemetryFrame {
    jspb.Message.setField(this, 3, value);
    return this;
  }

  getBlockingTimeMs(): number {
    return jspb.Message.getFieldWithDefault(this, 4, 0.0);
  }

  setBlockingTimeMs(value: number): TelemetryFrame {
    jspb.Message.setField(this, 4, value);
    return this;
  }

  getDomNodeCount(): number {
    return jspb.Message.getFieldWithDefault(this, 5, 0.0);
  }

  setDomNodeCount(value: number): TelemetryFrame {
    jspb.Message.setField(this, 5, value);
    return this;
  }

  getEventLoopLagMs(): number {
    return jspb.Message.getFieldWithDefault(this, 6, 0.0);
  }

  setEventLoopLagMs(value: number): TelemetryFrame {
    jspb.Message.setField(this, 6, value);
    return this;
  }

  getTimestampEpoch(): number {
    return jspb.Message.getFieldWithDefault(this, 7, 0);
  }

  setTimestampEpoch(value: number): TelemetryFrame {
    jspb.Message.setField(this, 7, value);
    return this;
  }

  override serializeBinary(): Uint8Array {
    const writer = new jspb.BinaryWriter();
    TelemetryFrame.serializeBinaryToWriter(this, writer);
    return writer.getResultBuffer();
  }

  static override serializeBinaryToWriter(message: TelemetryFrame, writer: jspb.BinaryWriter): void {
    const f1 = message.getSessionId();
    if (f1.length > 0) {
      writer.writeString(1, f1);
    }
    const f2 = message.getUrlPath();
    if (f2.length > 0) {
      writer.writeString(2, f2);
    }
    const f3 = message.getLongTaskDurationMs();
    if (f3 !== 0.0) {
      writer.writeFloat(3, f3);
    }
    const f4 = message.getBlockingTimeMs();
    if (f4 !== 0.0) {
      writer.writeFloat(4, f4);
    }
    const f5 = message.getDomNodeCount();
    if (f5 !== 0.0) {
      writer.writeFloat(5, f5);
    }
    const f6 = message.getEventLoopLagMs();
    if (f6 !== 0.0) {
      writer.writeFloat(6, f6);
    }
    const f7 = message.getTimestampEpoch();
    if (f7 !== 0) {
      writer.writeInt64(7, f7);
    }
  }

  static override deserializeBinary(bytes: Uint8Array): TelemetryFrame {
    const reader = new jspb.BinaryReader(bytes);
    const msg = new TelemetryFrame();
    return TelemetryFrame.deserializeBinaryFromReader(msg, reader);
  }

  static override deserializeBinaryFromReader(msg: TelemetryFrame, reader: jspb.BinaryReader): TelemetryFrame {
    while (reader.nextField()) {
      if (reader.isEndGroup()) {
        break;
      }
      const field = reader.getFieldNumber();
      switch (field) {
        case 1:
          msg.setSessionId(reader.readString());
          break;
        case 2:
          msg.setUrlPath(reader.readString());
          break;
        case 3:
          msg.setLongTaskDurationMs(reader.readFloat());
          break;
        case 4:
          msg.setBlockingTimeMs(reader.readFloat());
          break;
        case 5:
          msg.setDomNodeCount(reader.readFloat());
          break;
        case 6:
          msg.setEventLoopLagMs(reader.readFloat());
          break;
        case 7:
          msg.setTimestampEpoch(reader.readInt64());
          break;
        default:
          reader.skipField();
          break;
      }
    }
    return msg;
  }

  override toObject(): {
    sessionId: string;
    urlPath: string;
    longTaskDurationMs: number;
    blockingTimeMs: number;
    domNodeCount: number;
    eventLoopLagMs: number;
    timestampEpoch: number;
  } {
    return {
      sessionId: this.getSessionId(),
      urlPath: this.getUrlPath(),
      longTaskDurationMs: this.getLongTaskDurationMs(),
      blockingTimeMs: this.getBlockingTimeMs(),
      domNodeCount: this.getDomNodeCount(),
      eventLoopLagMs: this.getEventLoopLagMs(),
      timestampEpoch: this.getTimestampEpoch()
    };
  }
}

export class OptimizationVerdict extends jspb.Message {
  constructor(...args: unknown[]) {
    super();
    const opt_data = args[0] as jspb.Message.MessageArray | undefined;
    jspb.Message.initialize(this, opt_data || [], 0, -1, [], null);
  }

  getPredictedInpMs(): number {
    return jspb.Message.getFieldWithDefault(this, 1, 0.0);
  }

  setPredictedInpMs(value: number): OptimizationVerdict {
    jspb.Message.setField(this, 1, value);
    return this;
  }

  getVitalsCategory(): string {
    return jspb.Message.getFieldWithDefault(this, 2, '');
  }

  setVitalsCategory(value: string): OptimizationVerdict {
    jspb.Message.setField(this, 2, value);
    return this;
  }

  getArchitecturalAdvice(): string {
    return jspb.Message.getFieldWithDefault(this, 3, '');
  }

  setArchitecturalAdvice(value: string): OptimizationVerdict {
    jspb.Message.setField(this, 3, value);
    return this;
  }

  getOffloadToWorker(): boolean {
    return jspb.Message.getFieldWithDefault(this, 4, false);
  }

  setOffloadToWorker(value: boolean): OptimizationVerdict {
    jspb.Message.setField(this, 4, value);
    return this;
  }

  getYieldMainThread(): boolean {
    return jspb.Message.getFieldWithDefault(this, 5, false);
  }

  setYieldMainThread(value: boolean): OptimizationVerdict {
    jspb.Message.setField(this, 5, value);
    return this;
  }

  override serializeBinary(): Uint8Array {
    const writer = new jspb.BinaryWriter();
    OptimizationVerdict.serializeBinaryToWriter(this, writer);
    return writer.getResultBuffer();
  }

  static override serializeBinaryToWriter(message: OptimizationVerdict, writer: jspb.BinaryWriter): void {
    const f1 = message.getPredictedInpMs();
    if (f1 !== 0.0) {
      writer.writeFloat(1, f1);
    }
    const f2 = message.getVitalsCategory();
    if (f2.length > 0) {
      writer.writeString(2, f2);
    }
    const f3 = message.getArchitecturalAdvice();
    if (f3.length > 0) {
      writer.writeString(3, f3);
    }
    const f4 = message.getOffloadToWorker();
    if (f4) {
      writer.writeBool(4, f4);
    }
    const f5 = message.getYieldMainThread();
    if (f5) {
      writer.writeBool(5, f5);
    }
  }

  static override deserializeBinary(bytes: Uint8Array): OptimizationVerdict {
    const reader = new jspb.BinaryReader(bytes);
    const msg = new OptimizationVerdict();
    return OptimizationVerdict.deserializeBinaryFromReader(msg, reader);
  }

  static override deserializeBinaryFromReader(msg: OptimizationVerdict, reader: jspb.BinaryReader): OptimizationVerdict {
    while (reader.nextField()) {
      if (reader.isEndGroup()) {
        break;
      }
      const field = reader.getFieldNumber();
      switch (field) {
        case 1:
          msg.setPredictedInpMs(reader.readFloat());
          break;
        case 2:
          msg.setVitalsCategory(reader.readString());
          break;
        case 3:
          msg.setArchitecturalAdvice(reader.readString());
          break;
        case 4:
          msg.setOffloadToWorker(reader.readBool());
          break;
        case 5:
          msg.setYieldMainThread(reader.readBool());
          break;
        default:
          reader.skipField();
          break;
      }
    }
    return msg;
  }

  override toObject(): {
    predictedInpMs: number;
    vitalsCategory: string;
    architecturalAdvice: string;
    offloadToWorker: boolean;
    yieldMainThread: boolean;
  } {
    return {
      predictedInpMs: this.getPredictedInpMs(),
      vitalsCategory: this.getVitalsCategory(),
      architecturalAdvice: this.getArchitecturalAdvice(),
      offloadToWorker: this.getOffloadToWorker(),
      yieldMainThread: this.getYieldMainThread()
    };
  }
}

export class StreamSummary extends jspb.Message {
  constructor(...args: unknown[]) {
    super();
    const opt_data = args[0] as jspb.Message.MessageArray | undefined;
    jspb.Message.initialize(this, opt_data || [], 0, -1, [], null);
  }

  getFramesProcessed(): number {
    return jspb.Message.getFieldWithDefault(this, 1, 0);
  }

  setFramesProcessed(value: number): StreamSummary {
    jspb.Message.setField(this, 1, value);
    return this;
  }

  getAveragePredictedInp(): number {
    return jspb.Message.getFieldWithDefault(this, 2, 0.0);
  }

  setAveragePredictedInp(value: number): StreamSummary {
    jspb.Message.setField(this, 2, value);
    return this;
  }

  override serializeBinary(): Uint8Array {
    const writer = new jspb.BinaryWriter();
    StreamSummary.serializeBinaryToWriter(this, writer);
    return writer.getResultBuffer();
  }

  static override serializeBinaryToWriter(message: StreamSummary, writer: jspb.BinaryWriter): void {
    const f1 = message.getFramesProcessed();
    if (f1 !== 0) {
      writer.writeInt32(1, f1);
    }
    const f2 = message.getAveragePredictedInp();
    if (f2 !== 0.0) {
      writer.writeFloat(2, f2);
    }
  }

  static override deserializeBinary(bytes: Uint8Array): StreamSummary {
    const reader = new jspb.BinaryReader(bytes);
    const msg = new StreamSummary();
    return StreamSummary.deserializeBinaryFromReader(msg, reader);
  }

  static override deserializeBinaryFromReader(msg: StreamSummary, reader: jspb.BinaryReader): StreamSummary {
    while (reader.nextField()) {
      if (reader.isEndGroup()) {
        break;
      }
      const field = reader.getFieldNumber();
      switch (field) {
        case 1:
          msg.setFramesProcessed(reader.readInt32());
          break;
        case 2:
          msg.setAveragePredictedInp(reader.readFloat());
          break;
        default:
          reader.skipField();
          break;
      }
    }
    return msg;
  }

  override toObject(): {
    framesProcessed: number;
    averagePredictedInp: number;
  } {
    return {
      framesProcessed: this.getFramesProcessed(),
      averagePredictedInp: this.getAveragePredictedInp()
    };
  }
}
