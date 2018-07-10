
App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  hasVoted: false,

 init: function() {
       return App.initWeb3();
},

  initWeb3: function() {
    // TODO: refactor conditional
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.WebsocketProvider('http://gyaan.network:8546');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },

 initContract: function() {
    $.getJSON("MultiSigWalletDapp.json", function(MultiSigWalletDapp) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.MSWallet = TruffleContract(MultiSigWalletDapp);
      // Connect provider to interact with contract
      App.contracts.MSWallet.setProvider(App.web3Provider);
      return App.render();
    });
  },
 render: function() {
    var walletInstance;
    var loader = $("#loader");
    var active = $("#Active");
    var inactive = $("inActive");
    var contriTable = $("contributions");
    loader.show();
    contriTable.hide();
    active.hide();
    inactive.hide();
    //maybe add contributions.
    // Load account data
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html("Your Account: " + account);
      }
    });
    // Load contract data
    App.contracts.MultiSigWalletDapp.deployed().then(function(instance) {
      walletInstance = instance;
      return walletInstance.noOfContributors();

    }).then(function(numContributors) {
      var contributorsAmounts = $("#contributorsAmounts");
      contributorsAmounts.empty();

      for (var i = 0; i < numContributors; i++) {
        walletInstance.contributors(i).then(function(address) {
          walletInstance.contributorsMap(address).then(function(amountGiven){
            var contributionTemplate = "<tr><td>" + address + "</td><td>" + amountGiven + "</td></tr>";
            candidatesResults.append(contributionTemplate);
          });
        });
      }
      return walletInstance.noOfOpenProposals();

    }).then(function(numOProposals) {
      var openProposals = $("#openProposals");
      openProposals.empty();

      for (var i = 0; i < numOProposals; i++) {
        walletInstance.openProposals(i).then(function(address) {
          walletInstance.submittedProposals(address).then(function(proposal){
            var id = proposal[0];
            var name = candidate[1];
            var voteCount = candidate[2];
            // Render candidate Result
            var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td></tr>";
            candidatesResults.append(candidateTemplate);
          });
        });
      }
      return walletInstance.activeForProposals();

    }).then(function(isActive){
      loader.hide();
      contriTable.show();
      if(isActive){
        active.show();
      } else {
        inactive.show();
      }
    }).catch(function(error) {
        console.warn(error);
      });
  },
 castVote: function() {
    var candidateId = $('#candidatesSelect').val();
    App.contracts.Election.deployed().then(function(instance) {
      return instance.vote(candidateId, { from: App.account });
    }).then(function(result) {
      // Wait for votes to update
      $("#content").hide();
      $("#loader").show();
    }).catch(function(err) {
      console.error(err);
    });
  }
};
$(function() {
 $(window).load(function() {
    App.init();
  });
});
