import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngxs/store';
import VectorLayer from 'ol/layer/Vector';
import Map from 'ol/Map';
import VectorSource from 'ol/source/Vector';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { filter, take } from 'rxjs/operators';

import { MangolLayer } from '../../classes/Layer';
import { MangolState } from '../../mangol.state';
import {
  FeatureinfoDictionary,
  SetFeatureinfoResultsLayer
} from './../../store/featureinfo.state';

@Component({
  selector: 'mangol-featureinfo',
  templateUrl: './featureinfo.component.html',
  styleUrls: ['./featureinfo.component.scss']
})
export class FeatureinfoComponent implements OnInit, OnDestroy {
  layers$: Observable<MangolLayer[]>;
  selectedLayer$: Observable<MangolLayer>;
  map$: Observable<Map>;
  resultsLayer$: Observable<VectorLayer>;
  dictionary$: Observable<FeatureinfoDictionary>;

  mapSubscription: Subscription;

  constructor(private store: Store) {
    // Get the queryable layers
    this.layers$ = this.store.select((state: MangolState) =>
      state.layers.layers.filter(layer => layer.queryable)
    );
    // Get the selected layer
    this.selectedLayer$ = this.store.select(
      (state: MangolState) => state.featureinfo.selectedLayer
    );
    this.map$ = this.store.select((state: MangolState) => state.map.map);
    this.resultsLayer$ = this.store.select(
      (state: MangolState) => state.featureinfo.resultsLayer
    );
    this.dictionary$ = this.store.select(
      (state: MangolState) => state.featureinfo.dictionary
    );
  }

  ngOnInit() {
    const resultsLayer = new VectorLayer({
      source: new VectorSource({
        features: []
      })
    });

    // Add the resultsLayer to the map
    this.mapSubscription = this.map$
      .pipe(filter(m => m !== null))
      .subscribe(m => {
        m.addLayer(resultsLayer);
        this.store.dispatch(new SetFeatureinfoResultsLayer(resultsLayer));
      });
  }

  ngOnDestroy() {
    // Remove the resultsLayer from the map
    combineLatest(
      this.map$.pipe(filter(m => m !== null)),
      this.resultsLayer$.pipe(filter(r => r !== null))
    )
      .pipe(take(1))
      .subscribe(([m, resultsLayer]) => {
        m.removeLayer(resultsLayer);
      });
    if (this.mapSubscription) {
      this.mapSubscription.unsubscribe();
    }
  }
}
