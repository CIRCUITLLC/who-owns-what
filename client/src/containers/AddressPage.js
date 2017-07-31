import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';

import OwnersTable from 'components/OwnersTable';
import PropertiesMap from 'components/PropertiesMap';
import APIClient from 'components/APIClient';

import 'styles/AddressPage.css';

class AddressPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      searchAddress: { ...props.match.params },
      hasSearched: false,
      contacts: [],
      assocAddrs: []
    };
  }

  componentDidMount() {

    const query = this.state.searchAddress;

    APIClient.getLandlords(query).then(landlords => {

      if(landlords.length) {
        // for each landlord/rba found, add its rba to each addr object
        // and then reduce and concatenate them
        const addrs = landlords.map(l => {
          const assocRba = `${l.businesshousenumber} ${l.businessstreetname}${l.businessapartment ? ' ' + l.businessapartment : ''}, ${l.businesszip}`;
          return l.addrs.map(a => { return { ...a, assocRba }})
        }).reduce((a,b) => a.concat(b));

        this.setState({
          assocAddrs: addrs
        });

        // get array of bbls
        const bbls = addrs.map(addr => addr.bbl);

        // check for JFX users
        if(bbls.length) {
          APIClient.searchForJFXUsers(bbls).then(res => {
            this.setState({
              hasJustFixUsers: res.hasJustFixUsers
            })
          });
        }
      }


    });

    APIClient.getContacts(query).then(contacts => {
      this.setState({
        contacts: contacts.length ? contacts : [],
        hasSearched: true
      });
    });
  }

  render() {

    if(this.state.hasSearched && this.state.contacts.length == 0)  {
      return (
        <Redirect to={{
          pathname: '/',
          search: '?not-found=1'
        }}></Redirect>
      );
    }

    return (
      <div className="AddressPage">
        <div className="AddressPage__info">
          <h5 className="mb">Landlord info for {this.state.searchAddress.housenumber} {this.state.searchAddress.streetname}, {this.state.searchAddress.boro}:</h5>
          <OwnersTable
            contacts={this.state.contacts}
            hasJustFixUsers={this.state.hasJustFixUsers}
          />
          <h5 className="inline-block">We found <i>{this.state.assocAddrs.length}</i> associated buildings:</h5>
          <p className="inline-block float-right"><i>&nbsp;(click on a building to view details)</i></p>

        </div>
        <PropertiesMap
          addrs={this.state.assocAddrs}
          userAddr={this.state.searchAddress}
        />
      </div>
    );
  }
}

export default AddressPage;
