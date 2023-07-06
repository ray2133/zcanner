import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { VIDEO_CONFIG } from './scanner.const';
import jsQR from 'jsqr';
import { Subject, takeUntil, timer } from 'rxjs';
@Component({
  selector: 'app-scanner',
  templateUrl: './scanner.component.html',
  styleUrls: ['./scanner.component.css']
})
export class ScannerComponent implements AfterViewInit, OnDestroy {
@ViewChild('videoElement') video!: ElementRef<HTMLVideoElement>

@ViewChild('canvas',{static: true}) canvas!: ElementRef


videoStream!:MediaStream

config = structuredClone(VIDEO_CONFIG)

private destroy$ = new Subject<void>()
  result = '' 
ngAfterViewInit(): void {
  this.prepareScanner()
}

async prepareScanner() {
  const avalible = await this.checkCamera()
  if (avalible) this.startScanner()
}

changeCamera(){
  let {facingMode} =this.config.video

  this.config.video.facingMode = facingMode === 'enviroment' ? 'user': 'enviroment'
  this.startScanner()
}
async startScanner(){
   this.videoStream = await navigator.mediaDevices.getUserMedia(this.config)
   this.video.nativeElement.srcObject = this.videoStream

   this.spyCamera()
}

spyCamera(){
  if(this.video.nativeElement){
    const {clientWidth, clientHeight} = this.video.nativeElement

    this.canvas.nativeElement.width = clientWidth
    this.canvas.nativeElement.height = clientHeight

    const canvas = this.canvas.nativeElement.getContext('2d') as CanvasRenderingContext2D

    canvas.drawImage(this.canvas.nativeElement, 0, 0, clientWidth,clientHeight)

    const inversionAttempts = 'dontInvert'

    const image = canvas.getImageData(0,0,clientWidth,clientHeight)
    const qrcode = jsQR(image.data,image.width,clientHeight, {inversionAttempts})

    if(qrcode){
      const {data} = qrcode
      this.result = ""
      this.result = data

    }else{
      timer(500).pipe(takeUntil(this.destroy$)).subscribe( () =>{
        this.spyCamera()
      })
    }
  }
}

async checkCamera(){
   const cameraPermissions = await navigator.permissions.query({name:'camera' as any })
   console.log(cameraPermissions)

   const isOk = cameraPermissions.state !== "denied"

   const hasMediaDevice = 'mediaDevice' in navigator
   const hasUserMedia = 'getUserMedia' in navigator.mediaDevices

   if(!hasMediaDevice || (!hasUserMedia &&isOk)) {}

   return cameraPermissions.state != "denied"
}

ngOnDestroy() {
  this.videoStream.getTracks().forEach((track) => track.stop())
  this.video = null!
    this.destroy$.next()
    this.destroy$.complete()
}
    
}

