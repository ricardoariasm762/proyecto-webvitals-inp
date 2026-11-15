import { TestBed } from '@angular/core/testing';
import { VitalsSocketService } from './vitals-socket.service';

describe('VitalsSocketService', () => {
  let service: VitalsSocketService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [VitalsSocketService]
    });
    service = TestBed.inject(VitalsSocketService);
  });

  afterEach(() => {
    service.disconnect();
  });

  it('should be created successfully', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize oscilloscope buffer with 48 baseline elements', () => {
    const buffer = service.oscilloscopeBuffer();
    expect(buffer.length).toBe(48);
    expect(buffer[0]).toBe(16.6);
  });

  it('should initialize live verdict to null', () => {
    expect(service.liveVerdict()).toBeNull();
  });

  it('should register session identifier when subscribing', () => {
    service.subscribeToSession('NEXUS-TEST-01');
    expect(service).toBeTruthy();
  });

  it('should cleanly disconnect STOMP client on disconnect', () => {
    service.disconnect();
    expect(service.isConnected()).toBe(false);
    expect(service.connectionStatus()).toBe('DISCONNECTED');
  });
});

