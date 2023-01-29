import { Injectable } from '@angular/core'
import { BehaviorSubject, Observable } from 'rxjs'

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private storeDataSubjects: Map<string, BehaviorSubject<any>> = new Map()

  constructor() {}

  init(): void {
    const skeys = Object.keys(localStorage)

    skeys.forEach((k) => {
      const data = JSON.parse(localStorage[k])
      if (data) {
        this.storeDataSubjects.set(k, new BehaviorSubject<any>(data))
      }
    })
  }

  watch(key: string): Observable<any> | null {
    if (!this.storeDataSubjects.has(key)) {
      this.storeDataSubjects.set(key, new BehaviorSubject<any>(null))
    }
    let item: any = localStorage.getItem(key)
    let storeDataKey = this.storeDataSubjects.get(key)
    if (item == 'undefined') {
      item = undefined
    } else {
      item = JSON.parse(item)
    }

    if (storeDataKey) {
      storeDataKey.next(item)
    }
    return storeDataKey ? storeDataKey.asObservable() : null
    // this.storeDataSubjects.get(key).next(item);
    // return this.storeDataSubjects.get(key).asObservable();
  }

  set(key: string, value: any): void {
    console.log({key,value})

    let val = JSON.stringify(value)
    localStorage.setItem(key, val)
    let storeDataKey = this.storeDataSubjects.get(key)
    if (!this.storeDataSubjects.has(key) || !storeDataKey) {
      this.storeDataSubjects.set(key, new BehaviorSubject<any>(val))
    } else {
      storeDataKey.next(value)
      // this.storeDataSubjects.get(key).next(value);
    }
  }

  get(key: string): any {
    let valKey: any = localStorage.getItem(key)
    return JSON.parse(valKey)
  }

  remove(key: string): void {
    localStorage.removeItem(key)
    let storeDataKey = this.storeDataSubjects.get(key)
    if (!this.storeDataSubjects.has(key) || !storeDataKey) {
      this.storeDataSubjects.set(key, new BehaviorSubject<any>(null))
    } else {
      storeDataKey.next(null)
      // this.storeDataSubjects.get(key).next(null);
    }
  }

  getKeyList(search: string): string[] {
    const arr = Array.from(this.storeDataSubjects.keys())
    return arr.filter((x) => x.includes(search))
  }
}
