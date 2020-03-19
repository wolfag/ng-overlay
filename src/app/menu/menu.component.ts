import { Component, OnInit, TemplateRef, ViewChild } from "@angular/core";
import { Subject } from "rxjs";

@Component({
  selector: "app-menu",
  templateUrl: "./menu.component.html",
  styleUrls: ["./menu.component.scss"]
})
export class MenuComponent implements OnInit {
  readonly visible$ = new Subject<boolean>();
  @ViewChild(TemplateRef, { static: true }) menuTemplate: TemplateRef<any>;

  constructor() {}

  ngOnInit() {}
}
