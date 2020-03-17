import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppComponent} from './app.component';
import {MDBBootstrapModule} from 'angular-bootstrap-md';
import {NavbarComponent} from './Components/navbar/navbar.component';
import {WhoComponent} from './Components/body/who/who.component';
import {WhatComponent} from './Components/body/what/what.component';
import {WhereComponent} from './Components/body/where/where.component';
import {FooterComponent} from './Components/footer/footer.component';
import {RouterModule} from '@angular/router';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    WhoComponent,
    WhatComponent,
    WhereComponent,
    FooterComponent
  ],
  imports: [
    BrowserModule, MDBBootstrapModule.forRoot(),
    RouterModule.forRoot([
      {path: 'who', component: WhoComponent},
      {path: 'where', component: WhereComponent},
      {path: 'what', component: WhatComponent},
      {path: '**' , component : WhoComponent}
    ]),
    NgbModule


  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
