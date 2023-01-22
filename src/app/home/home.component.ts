import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  breakpoint: number = 3;

  ngOnInit() {
    this.breakpoint = (window.innerWidth <= 319) ? 1 : 2;
  }

  onResize(event: any) {
    this.breakpoint = (event.target.innerWidth <= 319) ? 1 : 6;
  }
}
